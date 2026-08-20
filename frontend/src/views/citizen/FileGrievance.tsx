import React, { useState, useEffect } from 'react';
import { useI18n } from '../../locales/i18n';
import { grievanceApi } from '../../api/grievanceApi';
import { departmentApi, DepartmentItem } from '../../api/departmentApi';
import { VoiceInputButton } from '../../components/common/VoiceInputButton';
import { AiSuggestionBanner } from '../../components/common/AiSuggestionBanner';
import { Modal } from '../../components/common/Modal';
import { IconSparkles, IconAttachment, IconCheck, IconSearch } from '../../assets/icons/Icons';
import { authApi } from '../../api/authApi';

interface FileGrievanceProps {
  onSuccess: (result: { trackingNumber: string; slaDays: number; slaDeadline: string }) => void;
  onRequireAuth: () => void;
}

export const FileGrievance: React.FC<FileGrievanceProps> = ({ onSuccess, onRequireAuth }) => {
  const { language, t } = useI18n();

  const [rawText, setRawText] = useState('');
  const [clarifiedText, setClarifiedText] = useState('');
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline auth modal state for seamless submission without prior login
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalStep, setAuthModalStep] = useState<'request' | 'verify'>('request');
  const [inlinePhone, setInlinePhone] = useState('');
  const [inlineName, setInlineName] = useState('');
  const [inlineOtp, setInlineOtp] = useState('');
  const [inlineDevOtp, setInlineDevOtp] = useState<string | null>(null);
  const [authModalLoading, setAuthModalLoading] = useState(false);
  const [authModalError, setAuthModalError] = useState<string | null>(null);

  // AI Classification state
  const [aiClassification, setAiClassification] = useState<{
    departmentId: string;
    category: string;
    confidence: number;
    reasoningEn: string;
    reasoningHi: string;
    requiresManualConfirmation: boolean;
  } | null>(null);

  const [showManualPicker, setShowManualPicker] = useState(false);

  useEffect(() => {
    departmentApi.getAll().then((res) => {
      setDepartments(res.departments);
      if (res.departments.length > 0) {
        setSelectedDepartmentId(res.departments[0].id);
      }
    }).catch(console.warn);
  }, []);

  const handleAnalyzeWithAi = async () => {
    if (rawText.trim().length < 10) {
      setError(language === 'hi' ? 'कृपया अपनी समस्या का कम से कम 10 अक्षरों में विवरण दें।' : 'Please describe your problem in at least 10 characters.');
      return;
    }

    setError(null);
    setIsClassifying(true);

    try {
      // Parallel execution of classification & rewriting
      const [classifyRes, clarifyRes] = await Promise.all([
        grievanceApi.classify(rawText.trim()),
        grievanceApi.clarify(rawText.trim(), language),
      ]);

      setAiClassification(classifyRes);
      setSelectedDepartmentId(classifyRes.departmentId);
      setCategory(classifyRes.category);
      setClarifiedText(clarifyRes.clarifiedText);

      if (classifyRes.requiresManualConfirmation) {
        setShowManualPicker(true);
      }
    } catch (err: any) {
      console.warn('[SuGam AI Flow] AI analysis warning:', err);
      // If AI fails, provide manual picker
      setShowManualPicker(true);
      setClarifiedText(rawText);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const token = localStorage.getItem('sugam_token');
    if (!token) {
      // Open inline verification modal so drafted grievance is never lost
      setShowAuthModal(true);
      return;
    }

    if (!selectedDepartmentId) {
      setError(language === 'hi' ? 'कृपया संबंधित विभाग चुनें।' : 'Please select a handling department.');
      return;
    }

    if (!rawText.trim()) {
      setError(language === 'hi' ? 'कृपया शिकायत का विवरण दर्ज करें।' : 'Please enter grievance description.');
      return;
    }

    executeSubmission();
  };

  const executeSubmission = async () => {
    setIsSubmitting(true);

    try {
      const res = await grievanceApi.submit({
        departmentId: selectedDepartmentId,
        category: category.trim() || 'General Civic Grievance',
        rawText: rawText.trim(),
        clarifiedText: clarifiedText.trim() || undefined,
        language,
        priority,
        photoUrl: attachmentName ? `mock_uploads/${attachmentName}` : undefined,
        aiClassificationConfidence: aiClassification?.confidence,
        aiReasoning: aiClassification ? (language === 'hi' ? aiClassification.reasoningHi : aiClassification.reasoningEn) : undefined,
      });

      onSuccess({
        trackingNumber: res.trackingNumber,
        slaDays: res.slaDays,
        slaDeadline: res.slaDeadline,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit grievance. Please verify your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInlineOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthModalError(null);
    if (!/^[6-9]\d{9}$/.test(inlinePhone.trim())) {
      setAuthModalError(language === 'hi' ? 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setAuthModalLoading(true);
    try {
      const res = await authApi.requestOtp(inlinePhone.trim());
      if (res.devOtp) {
        setInlineDevOtp(res.devOtp);
      }
      setAuthModalStep('verify');
    } catch (err: any) {
      setAuthModalError(err.message || 'Failed to send OTP code.');
    } finally {
      setAuthModalLoading(false);
    }
  };

  const handleInlineOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthModalError(null);
    if (!inlineOtp.trim()) return;

    setAuthModalLoading(true);
    try {
      const res = await authApi.verifyOtp(inlinePhone.trim(), inlineOtp.trim(), inlineName.trim() || undefined, language);
      localStorage.setItem('sugam_token', res.token);
      localStorage.setItem('sugam_user', JSON.stringify(res.user));
      setShowAuthModal(false);
      // Immediately execute the grievance submission
      executeSubmission();
    } catch (err: any) {
      setAuthModalError(err.message || 'Invalid verification code.');
    } finally {
      setAuthModalLoading(false);
    }
  };

  const selectedDeptObj = departments.find(d => d.id === selectedDepartmentId);

  return (
    <div className="container" style={{ maxWidth: '800px', marginTop: '20px' }}>
      <div className="card">
        <div style={{ marginBottom: '24px' }}>
          <h2>{t('grievance.fileTitle')}</h2>
          <p style={{ marginTop: '6px', fontSize: '0.95rem' }}>{t('grievance.fileSubtitle')}</p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-status-rejected-bg)',
              color: 'var(--color-status-rejected)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontWeight: 500,
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Input Section: Text + Voice */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="raw-text-input" className="form-label" style={{ margin: 0 }}>
                {t('grievance.describeProblem')} *
              </label>
              <VoiceInputButton
                onTranscript={(transcript) => {
                  setRawText((prev) => (prev ? `${prev} ${transcript}` : transcript));
                }}
              />
            </div>

            <textarea
              id="raw-text-input"
              className="form-textarea"
              style={{ minHeight: '140px' }}
              placeholder={t('grievance.describePlaceholder')}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              required
            />
          </div>

          {/* AI Assistance Action Trigger */}
          <div style={{ marginBottom: '24px' }}>
            <button
              type="button"
              onClick={handleAnalyzeWithAi}
              disabled={isClassifying || rawText.trim().length < 10}
              className="btn btn-secondary w-full"
              style={{
                border: '1.5px solid var(--color-ai-border)',
                backgroundColor: 'var(--color-ai-tag-bg)',
                color: 'var(--color-ai-tag)',
                fontWeight: 700,
              }}
            >
              <IconSparkles size={18} />
              <span>{isClassifying ? t('grievance.analyzing') : t('grievance.analyzeAndClarify')}</span>
            </button>
          </div>

          {/* AI Results & Human Review Box */}
          {aiClassification && (
            <AiSuggestionBanner
              label="AI Department Routing & Clarification"
              subtext="Grounding in official departmental rules. You have full authority to edit or override before submitting."
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-500)', display: 'block' }}>
                      {t('grievance.aiDepartmentSuggested')}:
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-900)' }}>
                      {selectedDeptObj ? (language === 'hi' ? selectedDeptObj.name_hi : selectedDeptObj.name_en) : 'Assigned Department'}
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-neutral-600)', marginLeft: '8px' }}>
                      ({selectedDeptObj?.sla_days} days SLA)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowManualPicker(!showManualPicker)}
                    className="btn btn-outline btn-sm"
                  >
                    {showManualPicker ? 'Hide Manual Picker' : t('grievance.changeDepartment')}
                  </button>
                </div>

                <div style={{ backgroundColor: 'var(--color-white)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral-200)' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-neutral-600)' }}>
                    {t('grievance.aiReasoning')}:
                  </span>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-neutral-800)', marginTop: '2px' }}>
                    {language === 'hi' ? aiClassification.reasoningHi : aiClassification.reasoningEn}
                  </p>
                </div>
              </div>
            </AiSuggestionBanner>
          )}

          {/* Manual Department Picker (Fallback or User Override) */}
          {showManualPicker && (
            <div className="card" style={{ backgroundColor: 'var(--color-neutral-50)', marginBottom: '20px' }}>
              <div className="form-group">
                <label htmlFor="dept-select" className="form-label">{t('common.department')} *</label>
                <select
                  id="dept-select"
                  className="form-select"
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === 'hi' ? d.name_hi : d.name_en} ({d.sla_days} days SLA)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="cat-input" className="form-label">{t('common.category')}</label>
                <input
                  id="cat-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Water Contamination, Road Potholes..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* AI Clarified Text Preview & Editing */}
          {clarifiedText && (
            <div className="form-group">
              <label htmlFor="clarified-textarea" className="form-label">
                <span>{t('grievance.clarifiedDraft')}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-ai-tag)', fontWeight: 500 }}>
                  {t('grievance.clarifiedDisclaimer')}
                </span>
              </label>
              <textarea
                id="clarified-textarea"
                className="form-textarea"
                style={{ minHeight: '120px', backgroundColor: '#fdfefe', border: '1.5px solid var(--color-primary-300)' }}
                value={clarifiedText}
                onChange={(e) => setClarifiedText(e.target.value)}
              />
            </div>
          )}

          {/* Priority / Civic Urgency Selector */}
          <div className="grid grid-cols-2" style={{ marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="priority-select" className="form-label">{t('grievance.priorityLabel')}</label>
              <select
                id="priority-select"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="low">{t('grievance.priorityLow')}</option>
                <option value="medium">{t('grievance.priorityMedium')}</option>
                <option value="high">{t('grievance.priorityHigh')}</option>
                <option value="urgent">{t('grievance.priorityUrgent')}</option>
              </select>
            </div>

            {/* Optional Photo / Document Upload Simulation */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="file-upload-input" className="form-label">{t('grievance.attachmentLabel')}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <label
                  htmlFor="file-upload-input"
                  className="btn btn-secondary w-full"
                  style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  <IconAttachment size={16} />
                  <span>{attachmentName || 'Attach Photo / Doc'}</span>
                </label>
                <input
                  id="file-upload-input"
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAttachmentName(file.name);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting || !rawText.trim()}
            className="btn btn-primary btn-lg w-full"
            style={{ marginTop: '12px' }}
          >
            <IconCheck size={20} />
            <span>{isSubmitting ? t('grievance.submitting') : t('grievance.submitGrievance')}</span>
          </button>
        </form>
      </div>

      {/* Inline Quick OTP Verification Modal for Unauthenticated Users */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Quick Citizen Verification"
      >
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-neutral-600)' }}>
            Enter your mobile number to verify and instantly register your grievance.
          </p>
        </div>

        {authModalError && (
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '14px', fontSize: '0.85rem' }}>
            {authModalError}
          </div>
        )}

        {authModalStep === 'request' ? (
          <form onSubmit={handleInlineOtpRequest}>
            <div className="form-group">
              <label className="form-label">{t('auth.phoneLabel')} *</label>
              <input
                type="tel"
                className="form-input"
                placeholder={t('auth.phonePlaceholder')}
                value={inlinePhone}
                onChange={(e) => setInlinePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('auth.nameLabel')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('auth.namePlaceholder')}
                value={inlineName}
                onChange={(e) => setInlineName(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowAuthModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={authModalLoading || inlinePhone.length !== 10} className="btn btn-primary" style={{ flex: 2 }}>
                {authModalLoading ? t('common.loading') : t('auth.requestOtp')}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleInlineOtpVerify}>
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)', marginBottom: '14px', fontSize: '0.88rem' }}>
              <div>Verification code dispatched to: <strong>+91 {inlinePhone}</strong></div>
              {inlineDevOtp && (
                <div style={{ marginTop: '4px', color: 'var(--color-accent-700)', fontWeight: 600 }}>
                  [Dev Testing OTP: {inlineDevOtp}]
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">{t('auth.enterOtp')} *</label>
              <input
                type="text"
                className="form-input text-center"
                style={{ fontSize: '1.4rem', letterSpacing: '6px', fontWeight: 700 }}
                placeholder="------"
                value={inlineOtp}
                onChange={(e) => setInlineOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="button" onClick={() => setAuthModalStep('request')} className="btn btn-secondary" style={{ flex: 1 }}>
                {t('common.back')}
              </button>
              <button type="submit" disabled={authModalLoading || inlineOtp.length < 4} className="btn btn-primary" style={{ flex: 2 }}>
                {authModalLoading ? t('common.loading') : 'Verify & Submit'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
