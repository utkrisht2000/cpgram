import { env } from '../config/env';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export async function callGroq(
  messages: ChatMessage[],
  options: AiCompletionOptions = {}
): Promise<string> {
  const { temperature = 0.2, maxTokens = 1024, jsonMode = false } = options;

  if (!env.groqApiKey || env.groqApiKey.trim() === '') {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= env.aiMaxRetries) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), env.aiTimeoutMs);

    try {
      const response = await fetch(`${env.groqBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.groqApiKey}`,
        },
        body: JSON.stringify({
          model: env.groqModel,
          messages,
          temperature,
          max_tokens: maxTokens,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq HTTP ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as any;
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Groq returned an empty response.');
      }

      return content.trim();
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      console.warn(`[SuGam AI Layer - Groq] Attempt ${attempt} failed: ${err.message}`);
      if (attempt <= env.aiMaxRetries) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  throw lastError || new Error('Groq AI service request timed out or failed after retry.');
}

// Export backward-compatible alias
export const callOpenRouter = callGroq;
