import { callOpenRouter } from './openrouterClient';
import { buildClarifyPrompt } from './promptTemplates/clarifyPrompt';

export interface ClarifyResult {
  clarifiedText: string;
  isAiGenerated: boolean;
}

export async function clarifyText(rawText: string, languagePreference: string = 'en'): Promise<ClarifyResult> {
  const trimmed = rawText.trim();
  if (trimmed.length < 15) {
    return {
      clarifiedText: trimmed,
      isAiGenerated: false,
    };
  }

  try {
    const { system, user } = buildClarifyPrompt(trimmed, languagePreference);
    const response = await callOpenRouter(
      [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      { temperature: 0.3, maxTokens: 600 }
    );

    return {
      clarifiedText: response,
      isAiGenerated: true,
    };
  } catch (error: any) {
    console.warn(`[SuGam AI Layer] clarifyText fallback used: ${error.message}`);
    // Deterministic formatting fallback
    const fallback = trimmed
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .join('\n');

    return {
      clarifiedText: fallback,
      isAiGenerated: false,
    };
  }
}
