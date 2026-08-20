import React, { useState, useEffect } from 'react';
import { useI18n } from '../../locales/i18n';
import { grievanceApi, GrievanceDto } from '../../api/grievanceApi';
import { AiSuggestionBanner } from '../../components/common/AiSuggestionBanner';
import { IconSparkles, IconCheck } from '../../assets/icons/Icons';

interface FileAppealProps {
  grievanceId: string;
  onSuccess: (trackingNumber: string) => void;
  onCancel: () => void;
}

export const FileAppeal: React.FC<FileAppealProps> = ({ grievanceId, onSuccess, onCancel }) => {
  const { language, t } = useI18n();
  const [grievance, setGrievance] = useState<GrievanceDto | null>(null);
  const [dissatisfactionReason, setDissatisfactionReason] = useState('');
  const [appealDraft, setAppealDraft] = useState('');
  const [aiDraftUsed, setAiDraftUsed] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    grievanceApi.getById(grievanceId)
      .then((res) => setGrievance(res.grievance))
      .catch(console.warn);
  }, [grievanceId]);

  const handleGenerateAiDraft = async () => {
    if (!dissatisfactionReason.trim()) {
      setError(language === 'hi' ? 'कृपया असंतोष का संक्षिप्त कारण बताएं।' : 'Please explain why you are dissatisfied with the resolution.');
      return;
    }

    setError(null);
    setIsDrafting(true);

    try {
      const res = await grievanceApi.draftAppeal(grievanceId, dissatisfactionReason.trim(), language);
      setAppealDraft(res.appealDraft);
      setAiDraftUsed(true);
    } catch (err: any) {
      console.warn('AI Appeal draft failed:', err);
      // Fallback
      setAppealDraft(dissatisfactionReason);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = appealDraft.trim() || dissatisfactionReason.trim();

    if (!finalReason) {
      setError(language === 'hi' ? 'कृपया अपील का कारण दर्ज करें।' : 'Please provide grounds for your appeal.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await grievanceApi.submitAppeal(grievanceId, finalReason, aiDraftUsed);
      if (grievance) {
        onSuccess(grievance.tracking_number);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit appeal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '760px', marginTop: '20px' }}>
      <div className="card">
        <div style={{ marginBottom: '20px' }}>
          <h2>{t('appeal.title')}</h2>
          <p style={{ marginTop: '6px', fontSize: '0.92rem', color: 'var(--color-neutral-600)' }}>
            {t('appeal.subtitle')}
          </p>
        </div>

        {grievance && (
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--color-neutral-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-neutral-200)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-neutral-500)' }}>
              <span>Case: <strong>{grievance.tracking_number}</strong></span>
              <span>Category: <strong>{grievance.category}</strong></span>
            </div>
            {grievance.resolution_summary && (
              <div style={{ marginTop: '8px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--color-neutral-600)', fontWeight: 600 }}>Prior Resolution: </span>
                <span style={{ color: 'var(--color-neutral-800)' }}>{grievance.resolution_summary}</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-status-rejected-bg)',
              color: 'var(--color-status-rejected)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitAppeal}>
          <div className="form-group">
            <label htmlFor="dissatisfaction-input" className="form-label">
              {t('appeal.reasonLabel')} *
            </label>
            <textarea
              id="dissatisfaction-input"
              className="form-textarea"
              style={{ minHeight: '90px' }}
              placeholder={t('appeal.reasonPlaceholder')}
              value={dissatisfactionReason}
              onChange={(e) => setDissatisfactionReason(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={handleGenerateAiDraft}
              disabled={isDrafting || !dissatisfactionReason.trim()}
              className="btn btn-secondary w-full"
              style={{
                border: '1.5px solid var(--color-ai-border)',
                backgroundColor: 'var(--color-ai-tag-bg)',
                color: 'var(--color-ai-tag)',
                fontWeight: 700,
              }}
            >
              <IconSparkles size={16} />
              <span>{isDrafting ? t('appeal.drafting') : t('appeal.aiDraftButton')}</span>
            </button>
          </div>

          {appealDraft && (
            <AiSuggestionBanner
              label="AI Structured Appeal Draft"
              subtext={t('appeal.draftedNotice')}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '180px', backgroundColor: 'var(--color-white)', border: '1.5px solid var(--color-primary-300)' }}
                  value={appealDraft}
                  onChange={(e) => setAppealDraft(e.target.value)}
                  required
                />
              </div>
            </AiSuggestionBanner>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!appealDraft.trim() && !dissatisfactionReason.trim())}
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              <IconCheck size={18} />
              <span>{isSubmitting ? t('appeal.submitting') : t('appeal.submitAppeal')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
