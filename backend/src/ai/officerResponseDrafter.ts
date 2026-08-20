import { callOpenRouter } from './openrouterClient';
import { buildOfficerDraftPrompt } from './promptTemplates/officerDraftPrompt';

export interface OfficerDraftResult {
  suggestedDraft: string;
  isAiGenerated: boolean;
}

export async function draftOfficerResponse(
  grievanceText: string,
  category: string,
  actionType: 'request_info' | 'resolve' | 'internal_note',
  officerNotes?: string
): Promise<OfficerDraftResult> {
  try {
    const { system, user } = buildOfficerDraftPrompt(grievanceText, category, actionType, officerNotes);
    const response = await callOpenRouter(
      [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      { temperature: 0.3, maxTokens: 500 }
    );

    return {
      suggestedDraft: response,
      isAiGenerated: true,
    };
  } catch (error: any) {
    console.warn(`[SuGam AI Layer] officerResponseDrafter fallback used: ${error.message}`);
    // Deterministic procedural draft fallback
    let draft = '';
    if (actionType === 'resolve') {
      draft = `Field inspection was conducted regarding ${category}. Rectification work has been executed on site and verified in accordance with municipal standards. Case stands resolved.`;
    } else if (actionType === 'request_info') {
      draft = `To proceed with resolution regarding ${category}, please provide the exact landmark / property number and any supporting photograph or document.`;
    } else {
      draft = `Internal inspection initiated. Coordinating with departmental technical team for on-site assessment.`;
    }

    return {
      suggestedDraft: draft,
      isAiGenerated: false,
    };
  }
}
