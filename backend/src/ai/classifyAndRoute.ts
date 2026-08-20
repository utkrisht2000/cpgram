import { callOpenRouter } from './openrouterClient';
import { buildClassificationPrompt } from './promptTemplates/classificationPrompt';
import { Department, DepartmentModel } from '../models/department.model';

export interface ClassificationResult {
  departmentId: string;
  departmentCode: string;
  category: string;
  confidence: number;
  reasoningEn: string;
  reasoningHi: string;
  isAiGenerated: boolean;
  requiresManualConfirmation: boolean;
}

// Fallback keyword-based routing when AI call fails or key is unconfigured
function fallbackKeywordClassification(text: string, departments: Department[]): ClassificationResult {
  const lower = text.toLowerCase();
  
  // Keyword scoring map
  const matchRules = [
    { keywords: ['water', 'pipe', 'leak', 'drain', 'पानी', 'नल', 'सीवर', 'गंदा पानी', 'जल'], code: 'DEPT_WATER', cat: 'Water Supply & Quality' },
    { keywords: ['electric', 'power', 'meter', 'voltage', 'bill', 'बिजली', 'मीटर', 'करंट', 'कटौती'], code: 'DEPT_POWER', cat: 'Power & Billing' },
    { keywords: ['road', 'pothole', 'street', 'light', 'repair', 'सड़क', 'गड्ढे', 'स्ट्रीट लाइट', 'मार्ग'], code: 'DEPT_ROADS', cat: 'Roads & Infrastructure' },
    { keywords: ['pension', 'old age', 'widow', 'disability', 'पेंशन', 'वृद्धावस्था', 'दिव्यांग', 'भत्ता'], code: 'DEPT_WELFARE', cat: 'Pensions & Social Welfare' },
    { keywords: ['hospital', 'doctor', 'medicine', 'clinic', 'स्वास्थ्य', 'अस्पताल', 'दवा', 'डॉक्टर', 'इलाज'], code: 'DEPT_HEALTH', cat: 'Public Health Services' },
    { keywords: ['garbage', 'waste', 'cleaning', 'trash', 'कचरा', 'सफाई', 'कूड़ा', 'सफाईकर्मी'], code: 'DEPT_SANITATION', cat: 'Sanitation & Waste' },
    { keywords: ['ration', 'dealer', 'pds', 'grain', 'राशन', 'कोटा', 'राशन कार्ड', 'खाद्यान्न'], code: 'DEPT_FOOD', cat: 'Public Distribution System' },
    { keywords: ['bus', 'traffic', 'transport', 'fare', 'बस', 'यातायात', 'परिवहन', 'किराया'], code: 'DEPT_TRANSPORT', cat: 'Urban Transport' },
  ];

  for (const rule of matchRules) {
    if (rule.keywords.some(k => lower.includes(k))) {
      const dept = departments.find(d => d.code === rule.code);
      if (dept) {
        return {
          departmentId: dept.id,
          departmentCode: dept.code,
          category: rule.cat,
          confidence: 0.78,
          reasoningEn: `Identified civic issue related to ${dept.name_en}.`,
          reasoningHi: `${dept.name_hi} से संबंधित नागरिक समस्या की पहचान की गई।`,
          isAiGenerated: false,
          requiresManualConfirmation: false,
        };
      }
    }
  }

  // Default fallback to first department (General administration)
  const defaultDept = departments[0] || { id: 'dept-general', code: 'DEPT_GEN', name_en: 'Public Administration', name_hi: 'सामान्य प्रशासन' };
  return {
    departmentId: defaultDept.id,
    departmentCode: defaultDept.code,
    category: 'General Civic Inconvenience',
    confidence: 0.50,
    reasoningEn: 'Could not automatically match with high confidence. Please select your department.',
    reasoningHi: 'उच्च सटीकता के साथ विभाग का मिलान नहीं हो सका। कृपया संबंधित विभाग चुनें।',
    isAiGenerated: false,
    requiresManualConfirmation: true,
  };
}

export async function classifyAndRoute(rawText: string): Promise<ClassificationResult> {
  const departments = DepartmentModel.findAll();
  if (!departments || departments.length === 0) {
    throw new Error('No active departments found in database.');
  }

  try {
    const { system, user } = buildClassificationPrompt(rawText, departments);
    const response = await callOpenRouter(
      [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      { temperature: 0.1, jsonMode: true }
    );

    const parsed = JSON.parse(response);
    
    // Verify that the suggested department ID actually exists in the DB
    const matchedDept = departments.find(d => d.id === parsed.department_id || d.code === parsed.department_code);
    const validDeptId = matchedDept ? matchedDept.id : departments[0].id;
    const validDeptCode = matchedDept ? matchedDept.code : departments[0].code;
    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.7;

    return {
      departmentId: validDeptId,
      departmentCode: validDeptCode,
      category: parsed.category || 'General Grievance',
      confidence,
      reasoningEn: parsed.reasoning_en || `Routing to ${matchedDept?.name_en || 'Department'} based on grievance content.`,
      reasoningHi: parsed.reasoning_hi || `शिकायत सामग्री के आधार पर ${matchedDept?.name_hi || 'विभाग'} को अग्रेषित किया जा रहा है।`,
      isAiGenerated: true,
      requiresManualConfirmation: confidence < 0.65,
    };
  } catch (error: any) {
    console.warn(`[SuGam AI Layer] classifyAndRoute fallback used: ${error.message}`);
    return fallbackKeywordClassification(rawText, departments);
  }
}
