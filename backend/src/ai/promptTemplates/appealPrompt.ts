export function buildAppealPrompt(
  originalGrievance: string,
  resolutionSummary: string,
  citizenDissatisfaction: string,
  preferredLanguage: string = 'en'
): { system: string; user: string } {
  const system = `You are the appeal drafting assistant for SuGam.
Assist a citizen in drafting a formal, respectful, and well-reasoned appeal addressed to the Nodal Appellate Authority.
The citizen is appealing a previous grievance resolution that was incomplete, incorrect, or unsatisfactory.

Strict Rules:
1. Ground the appeal in the facts of the original grievance, the department's stated resolution, and the citizen's specific dissatisfaction.
2. Structure the appeal logically:
   - Reference to original grievance
   - Ground for appeal (why the resolution was deficient)
   - Specific prayer/remedy sought
3. Keep the tone formal and respectful.
4. Output the appeal in the citizen's preferred language (${preferredLanguage === 'hi' ? 'Hindi' : 'English'}).
5. Output ONLY the drafted appeal text.`;

  const user = `Original Grievance:
"""
${originalGrievance}
"""

Department Resolution:
"""
${resolutionSummary}
"""

Citizen Dissatisfaction & Reasons:
"""
${citizenDissatisfaction}
"""`;

  return { system, user };
}
