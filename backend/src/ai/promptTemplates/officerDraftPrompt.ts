export function buildOfficerDraftPrompt(
  grievanceText: string,
  category: string,
  actionType: 'request_info' | 'resolve' | 'internal_note',
  officerNotes?: string
): { system: string; user: string } {
  const system = `You are an administrative drafting assistant for Redressal Officers in SuGam.
Draft a professional, courteous, and precise response based on the officer's intent.
This draft will ALWAYS be reviewed, edited, and approved by the human officer before sending.

Action requested: ${actionType}

Guidelines:
- Maintain an official yet citizen-centric tone.
- Ground the response solely in the provided grievance facts.
- Do not make false promises or unauthorized financial commitments.
- For 'request_info': clearly specify what documentation/details the citizen needs to supply.
- For 'resolve': clearly state the inspection finding or rectification action taken.
- Output ONLY the proposed text.`;

  const user = `Category: ${category}
Citizen Grievance:
"""
${grievanceText}
"""

Officer's rough notes/intent:
"""
${officerNotes || 'Standard procedural action'}
"""`;

  return { system, user };
}
