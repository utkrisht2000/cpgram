import { callOpenRouter } from './openrouterClient';
import { buildStatusTranslatePrompt } from './promptTemplates/statusTranslatePrompt';

export interface StatusTranslationResult {
  summaryEn: string;
  summaryHi: string;
  isAiGenerated: boolean;
}

export async function translateStatus(
  status: string,
  slaDetails: {
    daysRemaining: number;
    isBreached: boolean;
    isWarning: boolean;
    departmentNameEn: string;
    departmentNameHi: string;
  },
  lastRemark?: string | null
): Promise<StatusTranslationResult> {
  try {
    const { system, user } = buildStatusTranslatePrompt(status, slaDetails, lastRemark);
    const response = await callOpenRouter(
      [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      { temperature: 0.2, jsonMode: true }
    );

    const parsed = JSON.parse(response);
    return {
      summaryEn: parsed.summary_en || 'Your grievance is under active review.',
      summaryHi: parsed.summary_hi || 'आपकी शिकायत पर सक्रिय समीक्षा जारी है।',
      isAiGenerated: true,
    };
  } catch (error: any) {
    console.warn(`[SuGam AI Layer] statusTranslator fallback used: ${error.message}`);
    // Deterministic bilingual fallback
    let summaryEn = `Grievance is currently marked as ${status.replace('_', ' ')} in ${slaDetails.departmentNameEn}.`;
    let summaryHi = `शिकायत वर्तमान में ${slaDetails.departmentNameHi} में प्रक्रियाधीन है।`;

    if (status === 'resolved') {
      summaryEn = `Grievance has been resolved by ${slaDetails.departmentNameEn}.`;
      summaryHi = `${slaDetails.departmentNameHi} द्वारा शिकायत का समाधान कर दिया गया है।`;
    } else if (status === 'info_requested') {
      summaryEn = `Additional information is requested by the handling officer.`;
      summaryHi = `संबंधित अधिकारी द्वारा अतिरिक्त जानकारी मांगी गई है।`;
    } else if (slaDetails.isBreached) {
      summaryEn = `Standard SLA target elapsed. Case is escalated for priority redressal.`;
      summaryHi = `मानक एसएलए समय सीमा समाप्त। प्राथमिकता समाधान के लिए मामला अग्रेषित।`;
    }

    return {
      summaryEn,
      summaryHi,
      isAiGenerated: false,
    };
  }
}
