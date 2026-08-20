import { apiRequest } from './client';

export interface ChatMessageDto {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponseDto {
  reply: string;
  suggestedQuestions: string[];
}

export const chatApi = {
  sendMessage(
    message: string,
    history: ChatMessageDto[] = [],
    language: string = 'en'
  ): Promise<ChatResponseDto> {
    return apiRequest('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, language }),
    });
  },
};
