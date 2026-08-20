import { callGroq, ChatMessage } from './groqClient';
import { DepartmentModel } from '../models/department.model';

export interface ChatbotResponse {
  reply: string;
  suggestedQuestions: string[];
}

export function buildChatbotSystemPrompt(): string {
  const departments = DepartmentModel.findAll();
  const deptSummary = departments.map(d => `- ${d.name_en} (${d.name_hi}): Standard resolution SLA is ${d.sla_days} days. Handles: ${d.description_en}`).join('\n');

  return `You are "SuGam Sahayak" (SuGam Citizen Civic Assistant), an intelligent, courteous, and authoritative digital governance assistant for the SuGam Grievance Redressal platform in India.

Your primary objective is to assist citizens with:
1. How to lodge/file complaints and grievances on SuGam (explain voice input, plain language, and tracking numbers).
2. Identifying the correct government department and category for their civic problems.
3. Informing them about statutory Resolution SLAs (Service Level Agreements) and departmental turnaround targets.
4. Explaining how to track grievances using registration numbers (e.g. SGM-2026-XXXX) without needing complex logins.
5. Guiding citizens on filing a First Appeal to the Nodal Appellate Authority if they are dissatisfied with a resolution (statutory 90-day appeal window).
6. Providing general guidance on welfare schemes, pension verification (DBT / Aadhaar link), electricity billing disputes, and municipal civic services.

Department Directory & Official SLAs:
${deptSummary}

Key Platform Rules:
- Citizens can file grievances without logging in beforehand (inline OTP verification upon submit).
- Tracking is 100% public — enter tracking number anytime to view chronological timeline and officer actions.
- Post-resolution appeals are guaranteed and never gated behind rating scores.
- SLA breach triggers automatic escalation to supervisory Nodal IAS officers.

Guidelines for Answers:
- Be clear, practical, structured, and helpful. Use bullet points where appropriate.
- Respond in the user's preferred language (English, Hindi in Devanagari, or Hinglish).
- NEVER use emojis in any part of your response (strict system rule).
- If a problem involves immediate civic life hazards (such as sparking live electrical wire or building collapse), urge emergency caution in addition to lodging an urgent priority grievance.`;
}

export async function askCivicChatbot(
  userMessage: string,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  preferredLanguage: string = 'en'
): Promise<ChatbotResponse> {
  const systemPrompt = buildChatbotSystemPrompt();

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6).map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userMessage }
  ];

  const defaultSuggestionsEn = [
    'How do I file a water supply grievance?',
    'What is the SLA deadline for electricity issues?',
    'How can I track my complaint without login?',
    'How do I appeal an unsatisfactory resolution?'
  ];

  const defaultSuggestionsHi = [
    'शिकायत कैसे दर्ज करें?',
    'बिजली और पानी की शिकायत की समय सीमा क्या है?',
    'बिना लॉगिन स्थिति कैसे ट्रैक करें?',
    'असंतोषजनक समाधान के खिलाफ अपील कैसे करें?'
  ];

  try {
    const reply = await callGroq(messages, { temperature: 0.3, maxTokens: 800 });

    return {
      reply,
      suggestedQuestions: preferredLanguage === 'hi' ? defaultSuggestionsHi : defaultSuggestionsEn,
    };
  } catch (err: any) {
    console.warn('[SuGam Chatbot Fallback] Groq call failed:', err.message);

    // Rule-based deterministic fallback responses for common civic queries
    const lower = userMessage.toLowerCase();
    let reply = '';

    if (lower.includes('water') || lower.includes('पानी') || lower.includes('सीवर')) {
      reply = preferredLanguage === 'hi'
        ? 'जल आपूर्ति अथवा सीवरेज संबंधी समस्या के लिए आप "शिकायत दर्ज करें" बटन पर क्लिक करके विवरण लिख या बोल सकते हैं। नगर जल आपूर्ति बोर्ड का मानक समाधान समय 7 दिन है।'
        : 'For drinking water contamination, pipe leakages, or sewerage overflow, you can file a grievance under Municipal Water Supply & Sewerage. The statutory resolution target is 7 days.';
    } else if (lower.includes('track') || lower.includes('ट्रैक') || lower.includes('status') || lower.includes('स्थिति')) {
      reply = preferredLanguage === 'hi'
        ? 'आप बिना लॉगिन किए भी "स्थिति ट्रैक करें" टैब पर जाकर अपनी पंजीकरण संख्या (जैसे SGM-2026-1049) डालकर पूरी केस हिस्ट्री और एसएलए उलटी गिनती देख सकते हैं।'
        : 'You can track any grievance without logging in. Click "Track Grievance" in the top bar, enter your Registration Number (e.g. SGM-2026-1049), and click Track Now to see live status and officer remarks.';
    } else if (lower.includes('appeal') || lower.includes('अपील')) {
      reply = preferredLanguage === 'hi'
        ? 'यदि आप विभाग के निस्तारण से संतुष्ट नहीं हैं, तो समाधान के 90 दिनों के भीतर आप प्रथम अपील दायर कर सकते हैं। यह सीधे नोडल अपीलीय अधिकारी के पास समीक्षा हेतु जाती है।'
        : 'If a grievance resolution is incomplete or unsatisfactory, you have the statutory right to file a First Appeal within 90 days of resolution. It will be reviewed independently by the Nodal Appellate Authority.';
    } else {
      reply = preferredLanguage === 'hi'
        ? 'सुगम नागरिक सहायक में आपका स्वागत है। आप शिकायत दर्ज करने की विधि, विभागीय समय सीमा (SLA), ट्रैकिंग प्रक्रिया अथवा अपीलीय नियमों के बारे में पूछ सकते हैं।'
        : 'Welcome to SuGam Citizen Civic Assistant. You can ask any question regarding how to file complaints, departmental jurisdictions, SLA resolution timelines, tracking your case, or filing supervisory appeals.';
    }

    return {
      reply,
      suggestedQuestions: preferredLanguage === 'hi' ? defaultSuggestionsHi : defaultSuggestionsEn,
    };
  }
}
