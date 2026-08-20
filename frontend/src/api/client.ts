const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Client-side fallback dataset for standalone static GitHub Pages deployment
const STATIC_DEMO_DATA: Record<string, any> = {
  '/departments': {
    departments: [
      { id: 'dept-001', code: 'WATER', name_en: 'Municipal Water Supply & Sewerage', name_hi: 'नगर जल आपूर्ति एवं सीवरेज बोर्ड', description_en: 'Drinking water pipeline contamination, low water pressure, sewer line choke, and billing disputes.', sla_days: 7 },
      { id: 'dept-002', code: 'POWER', name_en: 'Electricity Distribution Corporation', name_hi: 'विद्युत वितरण निगम लिमिटेड', description_en: 'Power transformer faults, frequent voltage fluctuations, broken electrical poles, and meter errors.', sla_days: 5 },
      { id: 'dept-003', code: 'ROADS', name_en: 'Public Works & Urban Roadways', name_hi: 'लोक निर्माण एवं नगरीय सड़क विभाग', description_en: 'Deep road potholes, broken storm-water drains, missing manhole covers, and street paving.', sla_days: 15 },
      { id: 'dept-004', code: 'WELFARE', name_en: 'Social Welfare & Pension Schemes', name_hi: 'समाज कल्याण एवं पेंशन संभाग', description_en: 'Old age pensions, widow assistance, disability benefits, and Direct Benefit Transfer (DBT) verification.', sla_days: 21 },
      { id: 'dept-005', code: 'HEALTH', name_en: 'Public Health & Urban Sanitation', name_hi: 'जन स्वास्थ्य एवं नगर स्वच्छता संभाग', description_en: 'Garbage dump clearance, mosquito fogging, public toilet sanitation, and civic hygiene.', sla_days: 3 },
      { id: 'dept-006', code: 'FOOD', name_en: 'Food & Civil Supplies (PDS)', name_hi: 'खाद्य एवं नागरिक आपूर्ति विभाग', description_en: 'Ration card issuance, fair price shop irregularities, grain quality grievances, and quota allocations.', sla_days: 10 },
      { id: 'dept-007', code: 'TRANSPORT', name_en: 'Urban Transport & Road Safety', name_hi: 'नगरीय परिवहन एवं सड़क सुरक्षा प्राधिकरण', description_en: 'City bus routing, broken bus shelters, malfunctioning traffic lights, and public transport safety.', sla_days: 7 },
      { id: 'dept-008', code: 'REVENUE', name_en: 'Revenue & Land Records Administration', name_hi: 'राजस्व एवं भू-अभिलेख प्रशासन', description_en: 'Property mutation delays, demarcation disputes, land record corrections, and certificate issuance.', sla_days: 30 },
    ]
  },
  '/grievances/track/SGM-2026-1049': {
    grievance: {
      id: 'grv-001',
      tracking_number: 'SGM-2026-1049',
      citizen_name: 'Ramesh Kumar',
      citizen_phone: '9876543210',
      category: 'Contaminated Tap Water & Pipeline Leakage',
      raw_text: 'Drinking water has been muddy and smelling strongly of sewage for the past 3 days in Ward 14.',
      clarified_text: 'Complainant reports supply of muddy, sewage-contaminated drinking water across Ward 14, causing urgent public health risk.',
      language: 'en',
      status: 'in_progress',
      priority: 'urgent',
      sla_deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      is_escalated: 0,
      appeal_eligible: 0,
      department_name_en: 'Municipal Water Supply & Sewerage',
      department_name_hi: 'नगर जल आपूर्ति एवं सीवरेज बोर्ड',
      department_sla_days: 7,
      slaStatus: {
        slaDays: 7,
        daysRemaining: 4,
        hoursRemaining: 96,
        isWarning: false,
        isBreached: false,
        statusTextEn: '4 days remaining',
        statusTextHi: '4 दिन शेष'
      },
      translatedStatus: {
        en: 'Your grievance has been assigned to the Junior Field Engineer and on-site water testing is underway.',
        hi: 'आपकी शिकायत कनिष्ठ क्षेत्र अभियंता को आवंटित कर दी गई है तथा जल गुणवत्ता परीक्षण प्रगति पर है।'
      },
      timeline: [
        { id: 'tl-1', previous_status: null, new_status: 'submitted', remarks: 'Grievance registered successfully via SuGam citizen portal.', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), officer_name: 'System Dispatcher' },
        { id: 'tl-2', previous_status: 'submitted', new_status: 'under_review', remarks: 'Complaint triaged and assigned to field inspection unit.', created_at: new Date(Date.now() - 86400000 * 1.5).toISOString(), officer_name: 'Anil Verma' },
        { id: 'tl-3', previous_status: 'under_review', new_status: 'in_progress', remarks: 'Field maintenance crew dispatched to locate pipeline leakage near Sector 4.', created_at: new Date(Date.now() - 86400000 * 0.5).toISOString(), officer_name: 'Anil Verma' },
      ],
      notes: [],
      appeal: null,
    }
  }
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('sugam_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('sugam_token');
      localStorage.removeItem('sugam_user');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If 404 on a static GitHub Pages host, attempt demo data fallback
      if (response.status === 404 && STATIC_DEMO_DATA[endpoint]) {
        return STATIC_DEMO_DATA[endpoint] as T;
      }
      throw new ApiError(
        response.status,
        data.error || `HTTP ${response.status}: Request failed`,
        data
      );
    }

    return data as T;
  } catch (err: any) {
    // If backend is completely offline (e.g. static GitHub Pages hosting)
    if (STATIC_DEMO_DATA[endpoint]) {
      return STATIC_DEMO_DATA[endpoint] as T;
    }

    // Static fallback for Chatbot
    if (endpoint === '/chat') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      const msg = body.message || '';
      return {
        reply: `SuGam Citizen Assistant: For "${msg}", you can lodge a grievance under the relevant department in the File Grievance portal. Statutory SLA timelines range from 3 days (Sanitation/Health) to 7 days (Water/Transport) and 21 days (Welfare). You can also track your case anytime using the registration number without logging in.`,
        suggestedQuestions: [
          'How do I file a water supply grievance?',
          'What is the SLA deadline for electricity issues?',
          'How can I track my complaint without login?',
          'How do I appeal an unsatisfactory resolution?'
        ]
      } as unknown as T;
    }

    // Static fallback for AI classify
    if (endpoint === '/grievances/classify') {
      return {
        departmentId: 'dept-001',
        category: 'Municipal Water Supply & Sewerage',
        confidence: 0.92,
        reasoningEn: 'The grievance mentions water contamination and pressure issues, which falls under Municipal Water Supply.',
        reasoningHi: 'शिकायत में जल आपूर्ति व प्रदूषण का उल्लेख है, जो नगर जल आपूर्ति विभाग के अंतर्गत आता है।'
      } as unknown as T;
    }

    // Static fallback for OTP request
    if (endpoint === '/auth/citizen/otp/request') {
      return {
        message: 'Verification code generated for demonstration.',
        devOtp: '583693',
        expiresInMinutes: 5,
      } as unknown as T;
    }

    // Static fallback for OTP verify
    if (endpoint === '/auth/citizen/otp/verify') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return {
        token: 'demo-citizen-token-gh-pages',
        user: {
          id: 'demo-user-1',
          name: body.name || 'Citizen Ramesh Kumar',
          phone: body.phone || '9876543210',
          role: 'citizen',
          preferred_language: body.preferredLanguage || 'en',
        }
      } as unknown as T;
    }

    // Static fallback for grievance submission
    if (endpoint === '/grievances') {
      const trackId = `SGM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        grievanceId: 'grv-demo-new',
        trackingNumber: trackId,
        slaDays: 7,
        slaDeadline: new Date(Date.now() + 86400000 * 7).toISOString(),
        message: 'Grievance submitted successfully.',
      } as unknown as T;
    }

    throw err;
  }
}
