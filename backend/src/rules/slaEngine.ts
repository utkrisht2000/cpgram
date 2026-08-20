export interface SlaCalculation {
  deadline: Date;
  deadlineIso: string;
  totalDays: number;
}

export type SlaRiskStatus = 'safe' | 'warning' | 'breached' | 'resolved';

export interface SlaStatusDetail {
  status: SlaRiskStatus;
  daysRemaining: number;
  hoursRemaining: number;
  isBreached: boolean;
  isWarning: boolean; // Less than 48 hours remaining
  humanReadableEn: string;
  humanReadableHi: string;
  progressPercent: number;
}

export const SlaEngine = {
  // Compute exact SLA deadline given department SLA days and optional creation timestamp
  calculateDeadline(slaDays: number, startDate: Date = new Date()): SlaCalculation {
    const deadline = new Date(startDate.getTime() + slaDays * 24 * 60 * 60 * 1000);
    return {
      deadline,
      deadlineIso: deadline.toISOString(),
      totalDays: slaDays,
    };
  },

  // Evaluate current SLA status against deadline and completion state
  evaluateStatus(
    createdAtIso: string,
    deadlineIso: string,
    resolvedAtIso?: string | null,
    now: Date = new Date()
  ): SlaStatusDetail {
    const createdTime = new Date(createdAtIso).getTime();
    const deadlineTime = new Date(deadlineIso).getTime();
    const nowTime = now.getTime();

    // Cases resolved within SLA lifecycle
    if (resolvedAtIso) {
      const resolvedTime = new Date(resolvedAtIso).getTime();
      const wasBreached = resolvedTime > deadlineTime;
      return {
        status: 'resolved',
        daysRemaining: 0,
        hoursRemaining: 0,
        isBreached: wasBreached,
        isWarning: false,
        humanReadableEn: wasBreached ? 'Resolved after SLA deadline' : 'Resolved within target SLA',
        humanReadableHi: wasBreached ? 'एसएलए समय सीमा के बाद समाधान किया गया' : 'लक्ष्य एसएलए के भीतर समाधान किया गया',
        progressPercent: 100,
      };
    }

    const totalDuration = Math.max(1, deadlineTime - createdTime);
    const elapsedDuration = Math.max(0, nowTime - createdTime);
    const progressPercent = Math.min(100, Math.round((elapsedDuration / totalDuration) * 100));

    const millisRemaining = deadlineTime - nowTime;
    const hoursRemaining = Math.floor(millisRemaining / (1000 * 60 * 60));
    const daysRemaining = Math.floor(millisRemaining / (1000 * 60 * 60 * 24));

    if (millisRemaining <= 0) {
      const overdueDays = Math.abs(daysRemaining);
      return {
        status: 'breached',
        daysRemaining,
        hoursRemaining,
        isBreached: true,
        isWarning: false,
        humanReadableEn: overdueDays === 0 ? 'SLA breached today' : `SLA breached by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`,
        humanReadableHi: overdueDays === 0 ? 'एसएलए आज समाप्त हो गया' : `एसएलए ${overdueDays} दिन से समाप्त है`,
        progressPercent: 100,
      };
    }

    // Warning threshold: 48 hours remaining
    if (hoursRemaining <= 48) {
      return {
        status: 'warning',
        daysRemaining,
        hoursRemaining,
        isBreached: false,
        isWarning: true,
        humanReadableEn: `${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''} remaining before SLA deadline`,
        humanReadableHi: `समय सीमा से पहले ${hoursRemaining} घंटे शेष हैं`,
        progressPercent,
      };
    }

    return {
      status: 'safe',
      daysRemaining,
      hoursRemaining,
      isBreached: false,
      isWarning: false,
      humanReadableEn: `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining for standard resolution`,
      humanReadableHi: `मानक समाधान के लिए ${daysRemaining} दिन शेष हैं`,
      progressPercent,
    };
  }
};
