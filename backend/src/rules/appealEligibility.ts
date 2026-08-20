export interface AppealEligibilityResult {
  isEligible: boolean;
  reason: string;
  daysRemainingForAppeal?: number;
}

export const AppealEligibility = {
  // Post-resolution appeal eligibility is always guaranteed for citizens within 90 days of resolution
  evaluate(status: string, resolvedAtIso?: string | null, existingAppealStatus?: string | null): AppealEligibilityResult {
    if (existingAppealStatus) {
      return {
        isEligible: false,
        reason: `An appeal has already been filed for this grievance (Status: ${existingAppealStatus}).`,
      };
    }

    if (status !== 'resolved' && status !== 'rejected') {
      return {
        isEligible: false,
        reason: 'Appeals can only be submitted after a final resolution or decision has been recorded.',
      };
    }

    if (!resolvedAtIso) {
      return {
        isEligible: true,
        reason: 'Eligible for supervisory appellate review.',
        daysRemainingForAppeal: 90,
      };
    }

    const resolvedTime = new Date(resolvedAtIso).getTime();
    const ninetyDaysMillis = 90 * 24 * 60 * 60 * 1000;
    const expiryTime = resolvedTime + ninetyDaysMillis;
    const nowTime = Date.now();

    if (nowTime > expiryTime) {
      return {
        isEligible: false,
        reason: 'The statutory 90-day appeal window has elapsed since grievance resolution.',
      };
    }

    const daysRemaining = Math.ceil((expiryTime - nowTime) / (1000 * 60 * 60 * 24));
    return {
      isEligible: true,
      reason: 'Citizen is entitled to file an appeal.',
      daysRemainingForAppeal: daysRemaining,
    };
  }
};
