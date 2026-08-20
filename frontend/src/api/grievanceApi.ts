import { apiRequest } from './client';

export interface SlaStatusDto {
  status: 'safe' | 'warning' | 'breached' | 'resolved';
  daysRemaining: number;
  hoursRemaining: number;
  isBreached: boolean;
  isWarning: boolean;
  humanReadableEn: string;
  humanReadableHi: string;
  progressPercent: number;
}

export interface StatusHistoryDto {
  id: string;
  grievance_id: string;
  from_status: string | null;
  to_status: string;
  remarks: string | null;
  changed_by_type: string;
  changed_by_id: string | null;
  changed_by_name?: string;
  created_at: string;
}

export interface GrievanceDto {
  id: string;
  tracking_number: string;
  user_id: string;
  department_id: string;
  category: string;
  raw_text: string;
  clarified_text: string | null;
  language: string;
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'info_requested' | 'resolved' | 'rejected' | 'appealed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  photo_url: string | null;
  sla_deadline: string;
  is_escalated: number;
  ai_classification_confidence: number | null;
  ai_reasoning: string | null;
  resolution_summary: string | null;
  citizen_feedback_rating: number | null;
  citizen_feedback_comments: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  department_name_en?: string;
  department_name_hi?: string;
  citizen_name?: string;
  citizen_phone?: string;
  sla?: SlaStatusDto;
}

export interface NotificationDto {
  id: string;
  user_id: string;
  grievance_id: string | null;
  title_en: string;
  title_hi: string;
  message_en: string;
  message_hi: string;
  is_read: number;
  created_at: string;
}

export interface AppealDto {
  id: string;
  grievance_id: string;
  user_id: string;
  reason: string;
  ai_draft_used: number;
  status: 'submitted' | 'under_review' | 'upheld' | 'overturned';
  remarks: string | null;
  appellate_officer_id: string | null;
  appellate_officer_name?: string;
  tracking_number?: string;
  citizen_name?: string;
  citizen_phone?: string;
  department_name_en?: string;
  department_name_hi?: string;
  created_at: string;
  resolved_at: string | null;
}

export const grievanceApi = {
  classify(text: string): Promise<{
    departmentId: string;
    departmentCode: string;
    category: string;
    confidence: number;
    reasoningEn: string;
    reasoningHi: string;
    isAiGenerated: boolean;
    requiresManualConfirmation: boolean;
  }> {
    return apiRequest('/grievances/classify', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  clarify(text: string, language?: string): Promise<{
    clarifiedText: string;
    isAiGenerated: boolean;
  }> {
    return apiRequest('/grievances/clarify', {
      method: 'POST',
      body: JSON.stringify({ text, language }),
    });
  },

  submit(data: {
    departmentId: string;
    category: string;
    rawText: string;
    clarifiedText?: string;
    language: string;
    priority: string;
    photoUrl?: string;
    aiClassificationConfidence?: number;
    aiReasoning?: string;
  }): Promise<{
    grievance: GrievanceDto;
    trackingNumber: string;
    slaDeadline: string;
    slaDays: number;
  }> {
    return apiRequest('/grievances', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMyGrievances(): Promise<{ grievances: GrievanceDto[] }> {
    return apiRequest('/grievances/my');
  },

  track(trackingNumber: string): Promise<{
    grievance: GrievanceDto;
    department: any;
    history: StatusHistoryDto[];
    sla: SlaStatusDto;
    appeal: AppealDto | null;
    appealEligibility: { isEligible: boolean; reason: string; daysRemainingForAppeal?: number };
    plainLanguageStatus: { summaryEn: string; summaryHi: string; isAiGenerated: boolean };
  }> {
    return apiRequest(`/grievances/track/${encodeURIComponent(trackingNumber)}`);
  },

  getById(id: string): Promise<{
    grievance: GrievanceDto;
    department: any;
    history: StatusHistoryDto[];
    sla: SlaStatusDto;
    appeal: AppealDto | null;
    appealEligibility: { isEligible: boolean; reason: string; daysRemainingForAppeal?: number };
  }> {
    return apiRequest(`/grievances/${id}`);
  },

  draftAppeal(id: string, citizenDissatisfaction: string, language: string): Promise<{
    appealDraft: string;
    isAiGenerated: boolean;
  }> {
    return apiRequest(`/grievances/${id}/appeal-draft`, {
      method: 'POST',
      body: JSON.stringify({ citizenDissatisfaction, language }),
    });
  },

  submitAppeal(id: string, reason: string, aiDraftUsed: boolean): Promise<{ appeal: AppealDto }> {
    return apiRequest(`/grievances/${id}/appeal`, {
      method: 'POST',
      body: JSON.stringify({ reason, aiDraftUsed }),
    });
  },

  submitFeedback(id: string, rating: number, comments?: string): Promise<{ message: string }> {
    return apiRequest(`/grievances/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comments }),
    });
  },

  getNotifications(): Promise<{ notifications: NotificationDto[] }> {
    return apiRequest('/grievances/notifications/all');
  },

  markNotificationsRead(): Promise<{ success: boolean }> {
    return apiRequest('/grievances/notifications/mark-read', {
      method: 'POST',
    });
  },
};
