import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { askCivicChatbot } from '../ai/chatbot';

export const chatRouter = Router();

const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional(),
  language: z.string().optional(),
});

chatRouter.post('/', async (req: Request, res: Response, next) => {
  try {
    const { message, history = [], language = 'en' } = chatRequestSchema.parse(req.body);
    const result = await askCivicChatbot(message, history, language);
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});
