import { SlaEngine } from './slaEngine';

export interface EscalationCheckResult {
  shouldEscalate: boolean;
  reason: string | null;
  urgencyLevel: 'standard' | 'high' | 'critical';
}

export const EscalationRules = {
  // Determine if a grievance requires automatic supervisory escalation to Nodal Officer
  evaluateEscalation(
    createdAtIso: string,
    slaDeadlineIso: string,
    status: string,
    isAppealed: boolean = false,
    priority: string = 'medium',
    now: Date = new Date()
  ): EscalationCheckResult {
    if (status === 'resolved' || status === 'rejected') {
      return {
        shouldEscalate: false,
        reason: null,
        urgencyLevel: 'standard',
      };
    }

    if (isAppealed || status === 'appealed') {
      return {
        shouldEscalate: true,
        reason: 'Citizen filed an appeal against prior resolution',
        urgencyLevel: 'critical',
      };
    }

    const slaEvaluation = SlaEngine.evaluateStatus(createdAtIso, slaDeadlineIso, null, now);

    if (slaEvaluation.isBreached) {
      return {
        shouldEscalate: true,
        reason: `SLA deadline breached: ${slaEvaluation.humanReadableEn}`,
        urgencyLevel: 'critical',
      };
    }

    if (slaEvaluation.isWarning) {
      return {
        shouldEscalate: true,
        reason: `SLA deadline approaching: ${slaEvaluation.humanReadableEn}`,
        urgencyLevel: 'high',
      };
    }

    if (priority === 'urgent') {
      return {
        shouldEscalate: true,
        reason: 'Marked with urgent civic safety priority',
        urgencyLevel: 'high',
      };
    }

    return {
      shouldEscalate: false,
      reason: null,
      urgencyLevel: 'standard',
    };
  }
};
