import { SlaEngine } from '../src/rules/slaEngine';
import { EscalationRules } from '../src/rules/escalationRules';
import { AppealEligibility } from '../src/rules/appealEligibility';
import { DefaultOtpProvider } from '../src/auth/otpProvider';
import { runMigrations } from '../src/db/migrations/runMigrations';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('[Test Suite] Starting SuGam Rules & Auth Tests...');

  // Setup DB for test
  runMigrations();

  // Test 1: SlaEngine - calculateDeadline
  const start = new Date('2026-01-01T00:00:00Z');
  const slaCalc = SlaEngine.calculateDeadline(15, start);
  assert(slaCalc.totalDays === 15, 'SLA days must be 15');
  assert(new Date(slaCalc.deadlineIso).getTime() - start.getTime() === 15 * 86400000, 'Deadline must be 15 days from start');

  // Test 2: SlaEngine - evaluateStatus (Safe)
  const created = '2026-01-01T00:00:00Z';
  const deadline = '2026-01-16T00:00:00Z';
  const nowSafe = new Date('2026-01-05T00:00:00Z');
  const safeEval = SlaEngine.evaluateStatus(created, deadline, null, nowSafe);
  assert(safeEval.status === 'safe', 'Status should be safe');
  assert(!safeEval.isBreached, 'Should not be breached');
  assert(!safeEval.isWarning, 'Should not be warning');
  assert(safeEval.daysRemaining === 11, 'Days remaining should be 11');

  // Test 3: SlaEngine - evaluateStatus (Warning < 48 hours)
  const nowWarning = new Date('2026-01-15T00:00:00Z');
  const warningEval = SlaEngine.evaluateStatus(created, deadline, null, nowWarning);
  assert(warningEval.status === 'warning', 'Status should be warning');
  assert(warningEval.isWarning, 'isWarning should be true');
  assert(warningEval.hoursRemaining === 24, 'Hours remaining should be 24');

  // Test 4: SlaEngine - evaluateStatus (Breached)
  const nowBreached = new Date('2026-01-18T00:00:00Z');
  const breachedEval = SlaEngine.evaluateStatus(created, deadline, null, nowBreached);
  assert(breachedEval.status === 'breached', 'Status should be breached');
  assert(breachedEval.isBreached, 'isBreached should be true');

  // Test 5: EscalationRules
  const escSafe = EscalationRules.evaluateEscalation(created, deadline, 'in_progress', false, 'medium', nowSafe);
  assert(!escSafe.shouldEscalate, 'Safe case should not escalate');

  const escWarning = EscalationRules.evaluateEscalation(
    created,
    new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    'in_progress',
    false,
    'medium'
  );
  assert(escWarning.shouldEscalate, 'Warning case should escalate');

  const escAppealed = EscalationRules.evaluateEscalation(created, deadline, 'appealed', true, 'medium');
  assert(escAppealed.shouldEscalate, 'Appealed case must escalate to Nodal');
  assert(escAppealed.urgencyLevel === 'critical', 'Appealed case urgency must be critical');

  // Test 6: AppealEligibility
  const eligibleUnresolved = AppealEligibility.evaluate('in_progress', null, null);
  assert(!eligibleUnresolved.isEligible, 'Unresolved case should not be eligible for appeal');

  const eligibleResolved = AppealEligibility.evaluate('resolved', new Date().toISOString(), null);
  assert(eligibleResolved.isEligible, 'Resolved case must be eligible for appeal');

  const alreadyAppealed = AppealEligibility.evaluate('resolved', new Date().toISOString(), 'submitted');
  assert(!alreadyAppealed.isEligible, 'Already appealed case should not allow duplicate appeal');

  // Test 7: OTP Provider Flow
  const otpProvider = new DefaultOtpProvider();
  const sendRes = await otpProvider.sendOtp('9876543210');
  assert(sendRes.success, 'OTP send should succeed');
  assert(Boolean(sendRes.devOtp), 'Dev OTP should be generated in development mode');

  const verifySuccess = await otpProvider.verifyOtp('9876543210', sendRes.devOtp!);
  assert(verifySuccess.isValid, 'OTP verification with correct code should succeed');

  const verifyConsumed = await otpProvider.verifyOtp('9876543210', sendRes.devOtp!);
  assert(!verifyConsumed.isValid, 'Re-verifying consumed OTP should fail');

  console.log('[Test Suite] All 7 SuGam unit tests passed successfully.');
}

runTests().catch((err) => {
  console.error('[Test Suite Error]', err);
  process.exit(1);
});
