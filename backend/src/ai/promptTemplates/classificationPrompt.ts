import { Department } from '../../models/department.model';

export function buildClassificationPrompt(
  rawText: string,
  departments: Department[]
): { system: string; user: string } {
  const deptList = departments
    .map(
      (d) =>
        `- ID: "${d.id}", Code: "${d.code}", Name (EN): "${d.name_en}", Name (HI): "${d.name_hi}", Description: "${d.description_en}"`
    )
    .join('\n');

  const system = `You are the classification and routing engine for SuGam, an Indian digital grievance redressal platform.
Analyze the citizen's grievance text (which may be in English, Hindi, or mixed Hinglish) and map it accurately to one of the authorized departments listed below.

Authorized Departments:
${deptList}

You MUST respond strictly with valid JSON conforming to this schema:
{
  "department_id": "string (the exact ID of the matching department)",
  "department_code": "string (the code of the matching department)",
  "category": "string (short specific civic sub-category, e.g., 'Water Contamination', 'Electricity Meter Failure', 'Pension Disbursement Delay', 'Road Potholes', 'Sanitation Garbage')",
  "confidence": number (float between 0.0 and 1.0),
  "reasoning_en": "string (one concise, citizen-friendly sentence explaining the routing decision)",
  "reasoning_hi": "string (one concise Hindi sentence explaining the routing decision)"
}

Rules:
- If the grievance mentions multiple problems, select the primary or most critical civic hazard.
- If confidence is below 0.65, provide the best guess but set confidence accordingly.
- Do not invent departments outside the provided list.
- Return ONLY valid JSON, no markdown codeblocks, no commentary.`;

  const user = `Citizen Grievance Text:
"""
${rawText}
"""`;

  return { system, user };
}
