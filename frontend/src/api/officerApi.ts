import { apiRequest } from './client';
import { GrievanceDto, SlaStatusDto, StatusHistoryDto, AppealDto } from './grievanceApi';

export interface GrievanceNoteDto {
  id: string;
  grievance_id: string;
  officer_id: string;
  note_type: 'internal' | 'citizen_query' | 'resolution';
  content: string;
  created_at: string;
  officer_name?: string;
}

export interface OfficerPerformanceDto {
  totalCases: number;
  resolvedCases: number;
  pendingCases: number;
  breachedCases: number;
  avgResolutionDays: number;
  slaCompliancePercent: number;
}

export interface NodalDashboardDto {
  overview: {
    totalReceived: number;
    totalResolved: number;
    totalPending: number;
    totalBreached: number;
    overallBreachRate: number;
    totalAppealsPending: number;
  };
  departments: Array<{
    departmentId: string;
    departmentCode: string;
    departmentNameEn: string;
    departmentNameHi: string;
    slaDays: number;
    total: number;
    resolved: number;
    pending: number;
    breached: number;
    breachRate: number;
  }>;
}

export const officerApi = {
  getTriageQueue(params?: {
    status?: string;
    departmentId?: string;
    isEscalated?: boolean;
    priority?: string;
    startDate?: string;
    endDate?: string;
    searchQuery?: string;
  }): Promise<{ grievances: Array<GrievanceDto & { sla: SlaStatusDto; escalation: { shouldEscalate: boolean; reason: string | null; urgencyLevel: string } }> }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    return apiRequest(`/officers/triage?${query.toString()}`);
  },

  getCaseDetail(id: string): Promise<{
    grievance: GrievanceDto;
    department: any;
    history: StatusHistoryDto[];
    notes: GrievanceNoteDto[];
    sla: SlaStatusDto;
    appeal: AppealDto | null;
  }> {
    return apiRequest(`/officers/grievance/${id}`);
  },

  draftResponse(data: {
    grievanceText: string;
    category: string;
    actionType: 'request_info' | 'resolve' | 'internal_note';
    officerNotes?: string;
  }): Promise<{ suggestedDraft: string; isAiGenerated: boolean }> {
    return apiRequest('/officers/draft-response', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStatus(
    id: string,
    data: {
      status: 'acknowledged' | 'in_progress' | 'info_requested' | 'resolved' | 'rejected';
      remarks: string;
      resolutionSummary?: string;
    }
  ): Promise<{ message: string }> {
    return apiRequest(`/officers/grievance/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  addNote(
    id: string,
    data: {
      content: string;
      noteType: 'internal' | 'citizen_query' | 'resolution';
    }
  ): Promise<{ message: string; noteId: string }> {
    return apiRequest(`/officers/grievance/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPerformance(): Promise<{ metrics: OfficerPerformanceDto }> {
    return apiRequest('/officers/performance');
  },

  getNodalDashboard(): Promise<NodalDashboardDto> {
    return apiRequest('/officers/nodal/dashboard');
  },

  reassignDepartment(grievanceId: string, newDepartmentId: string, remarks: string): Promise<{ message: string }> {
    return apiRequest('/officers/nodal/reassign', {
      method: 'POST',
      body: JSON.stringify({ grievanceId, newDepartmentId, remarks }),
    });
  },

  getNodalAppeals(): Promise<{ appeals: AppealDto[] }> {
    return apiRequest('/officers/nodal/appeals');
  },

  decideAppeal(appealId: string, decision: 'upheld' | 'overturned', remarks: string): Promise<{ message: string }> {
    return apiRequest(`/officers/nodal/appeals/${appealId}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, remarks }),
    });
  },

  getExportSummary(): Promise<{ exportData: any[] }> {
    return apiRequest('/officers/nodal/export-summary');
  },
};
