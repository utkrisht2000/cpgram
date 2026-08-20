export function buildStatusTranslatePrompt(
  status: string,
  slaDetails: {
    daysRemaining: number;
    isBreached: boolean;
    isWarning: boolean;
    departmentNameEn: string;
    departmentNameHi: string;
  },
  lastRemark?: string | null
): { system: string; user: string } {
  const system = `You are the status translation assistant for SuGam.
Translate internal workflow status, SLA countdown, and departmental remarks into simple, reassuring, and clear 1-2 sentence updates for citizens in both English and Hindi.

Return ONLY a valid JSON object:
{
  "summary_en": "One or two plain, courteous sentences in English explaining current progress and next step.",
  "summary_hi": "One or two plain, courteous sentences in Hindi explaining current progress and next step."
}`;

  const user = `Context:
- Current Status: ${status}
- Handling Department: ${slaDetails.departmentNameEn} (${slaDetails.departmentNameHi})
- Days Remaining: ${slaDetails.daysRemaining}
- SLA Breached: ${slaDetails.isBreached}
- SLA Warning: ${slaDetails.isWarning}
- Officer's Latest Remark: "${lastRemark || 'Case is undergoing standard administrative processing.'}"`;

  return { system, user };
}
