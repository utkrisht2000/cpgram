import { callOpenRouter } from './openrouterClient';
import { buildAppealPrompt } from './promptTemplates/appealPrompt';

export interface AppealDraftResult {
  appealDraft: string;
  isAiGenerated: boolean;
}

export async function draftAppeal(
  originalGrievance: string,
  resolutionSummary: string,
  citizenDissatisfaction: string,
  preferredLanguage: string = 'en'
): Promise<AppealDraftResult> {
  try {
    const { system, user } = buildAppealPrompt(
      originalGrievance,
      resolutionSummary,
      citizenDissatisfaction,
      preferredLanguage
    );
    const response = await callOpenRouter(
      [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      { temperature: 0.3, maxTokens: 600 }
    );

    return {
      appealDraft: response,
      isAiGenerated: true,
    };
  } catch (error: any) {
    console.warn(`[SuGam AI Layer] appealDrafter fallback used: ${error.message}`);
    // Deterministic appeal structure fallback
    const draft = preferredLanguage === 'hi'
      ? `सेवा में,
अपीलीय प्राधिकारी महोदय,

विषय: पूर्व शिकायत निस्तारण के विरुद्ध प्रथम अपील।

महोदय,
मेरी मूल शिकायत के संबंध में जो निस्तारण विवरण प्रस्तुत किया गया है, वह पूर्णतः असंतोषजनक है।
समस्या का जमीनी स्तर पर समाधान नहीं हुआ है।

असंतोष का विवरण:
${citizenDissatisfaction}

निवेदन है कि इस मामले की पुनः निष्पक्ष जांच कराई जाए एवं समस्या का स्थायी समाधान कराया जाए।

धन्यवाद।`
      : `To,
The Nodal Appellate Authority,

Subject: First Appeal against unsatisfactory grievance resolution.

Respected Authority,
I am submitting this appeal regarding the resolution provided for my grievance. The ground-level issue remains unaddressed and the closure remarks do not reflect the actual ground reality.

Reasons for Dissatisfaction:
${citizenDissatisfaction}

I kindly request supervisory re-inspection and comprehensive remediation of the stated civic grievance.

Sincerely,
Aggrieved Citizen`;

    return {
      appealDraft: draft,
      isAiGenerated: false,
    };
  }
}
