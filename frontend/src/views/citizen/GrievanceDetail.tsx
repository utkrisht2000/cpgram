import React, { useState, useEffect } from 'react';
import { useI18n } from '../../locales/i18n';
import { grievanceApi, GrievanceDto, SlaStatusDto, StatusHistoryDto, AppealDto } from '../../api/grievanceApi';
import { TimelineStepper } from '../../components/common/TimelineStepper';
import { SlaBadge } from '../../components/common/SlaBadge';
import { IconSearch, IconSparkles, IconCheck, IconAttachment } from '../../assets/icons/Icons';

interface GrievanceDetailProps {
  initialTrackingNumber?: string;
  onFileAppeal: (grievanceId: string) => void;
}

export const GrievanceDetail: React.FC<GrievanceDetailProps> = ({ initialTrackingNumber = '', onFileAppeal }) => {
  const { language, t } = useI18n();
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<{
    grievance: GrievanceDto;
    department: any;
    history: StatusHistoryDto[];
    sla: SlaStatusDto;
    appeal: AppealDto | null;
    appealEligibility: { isEligible: boolean; reason: string; daysRemainingForAppeal?: number };
    plainLanguageStatus?: { summaryEn: string; summaryHi: string; isAiGenerated: boolean };
  } | null>(null);

  // Feedback form state
  const [rating, setRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const fetchTracking = async (numberToTrack: string) => {
    if (!numberToTrack.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const res = await grievanceApi.track(numberToTrack.trim());
      setData(res);
      if (res.grievance.citizen_feedback_rating) {
        setRating(res.grievance.citizen_feedback_rating);
        setFeedbackSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || 'No grievance record found with this registration number.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTrackingNumber) {
      fetchTracking(initialTrackingNumber);
    }
  }, [initialTrackingNumber]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(trackingNumber);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    try {
      await grievanceApi.submitFeedback(data.grievance.id, rating, feedbackComments);
      setFeedbackSubmitted(true);
    } catch (err: any) {
      console.warn('Feedback submit error:', err);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '840px', marginTop: '20px' }}>
      {/* Lookup Bar */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{t('tracking.trackTitle')}</h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-neutral-600)', marginBottom: '16px' }}>
          {t('tracking.trackSubtitle')}
        </p>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            className="form-input"
            placeholder={t('tracking.inputPlaceholder')}
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
            required
            style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '1px' }}
          />
          <button
            type="submit"
            disabled={loading || !trackingNumber.trim()}
            className="btn btn-primary"
            style={{ minWidth: '140px' }}
          >
            <IconSearch size={18} />
            <span>{loading ? t('common.loading') : t('tracking.trackButton')}</span>
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '14px', color: '#dc2626', fontSize: '0.88rem', fontWeight: 600 }}>
            {error}
          </div>
        )}
      </div>

      {/* Case Details View */}
      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Case Header Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-neutral-500)', letterSpacing: '1px', fontWeight: 600 }}>
                  Tracking Registration Number
                </span>
                <h1 style={{ fontSize: '1.75rem', fontFamily: 'monospace', color: 'var(--color-primary-900)', marginTop: '2px' }}>
                  {data.grievance.tracking_number}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span className={`badge badge-${data.grievance.status}`}>
                    {t(`status.${data.grievance.status}`, data.grievance.status)}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-neutral-600)' }}>
                    Priority: <strong style={{ textTransform: 'capitalize' }}>{data.grievance.priority}</strong>
                  </span>
                </div>
              </div>

              {/* SLA Target Widget */}
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-500)', display: 'block', marginBottom: '4px' }}>
                  {t('tracking.slaCountdown')}
                </span>
                <SlaBadge sla={data.sla} showProgress={true} />
              </div>
            </div>

            {/* AI Plain-Language Status Translation */}
            {data.plainLanguageStatus && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '14px 16px',
                  backgroundColor: 'var(--color-primary-50)',
                  border: '1px solid var(--color-primary-100)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <div style={{ color: 'var(--color-primary-700)', marginTop: '2px' }}>
                  <IconSparkles size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary-800)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Status Update (Plain Language)
                  </span>
                  <p style={{ fontSize: '0.95rem', color: 'var(--color-primary-900)', marginTop: '2px', fontWeight: 500, lineHeight: '1.4' }}>
                    {language === 'hi' ? data.plainLanguageStatus.summaryHi : data.plainLanguageStatus.summaryEn}
                  </p>
                </div>
              </div>
            )}

            {/* Grievance Statement */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-neutral-200)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{data.grievance.category}</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-neutral-800)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {data.grievance.clarified_text || data.grievance.raw_text}
              </p>

              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--color-neutral-600)' }}>
                Assigned Department: <strong>{language === 'hi' ? data.department?.name_hi : data.department?.name_en}</strong>
              </div>
            </div>

            {/* Official Resolution Summary (if resolved) */}
            {data.grievance.resolution_summary && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '16px',
                  backgroundColor: 'var(--color-status-resolved-bg)',
                  border: '1.5px solid #86efac',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-status-resolved)', fontWeight: 700 }}>
                  <IconCheck size={18} />
                  <span>{t('tracking.officialResolution')}</span>
                </div>
                <p style={{ marginTop: '6px', fontSize: '0.92rem', color: '#14532d', lineHeight: '1.4' }}>
                  {data.grievance.resolution_summary}
                </p>
              </div>
            )}
          </div>

          {/* Timeline Stepper Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>{t('tracking.timeline')}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-neutral-500)', marginBottom: '16px' }}>
              Full audit trail of all departmental transitions and officer remarks.
            </p>
            <TimelineStepper history={data.history} currentStatus={data.grievance.status} />
          </div>

          {/* Citizen Appeal Section (Always visible post-resolution) */}
          {(data.grievance.status === 'resolved' || data.grievance.status === 'rejected' || data.grievance.status === 'appealed') && (
            <div className="card" style={{ border: '1.5px solid var(--color-primary-300)', backgroundColor: '#fafcff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>{t('tracking.appealsSection')}</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-neutral-600)', marginTop: '4px' }}>
                    {data.appeal
                      ? `Appeal Status: ${data.appeal.status.toUpperCase()} (Submitted on ${new Date(data.appeal.created_at).toLocaleDateString()})`
                      : t('tracking.appealEligible')}
                  </p>
                </div>

                {!data.appeal && data.appealEligibility.isEligible && (
                  <button
                    type="button"
                    onClick={() => onFileAppeal(data.grievance.id)}
                    className="btn btn-primary"
                  >
                    {t('tracking.fileAppealButton')} &rarr;
                  </button>
                )}
              </div>

              {data.appeal && (
                <div style={{ marginTop: '14px', padding: '12px', backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral-200)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-neutral-700)' }}>
                    Citizen Appeal Grounds:
                  </span>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-neutral-800)', marginTop: '4px' }}>
                    {data.appeal.reason}
                  </p>
                  {data.appeal.remarks && (
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--color-neutral-200)' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-800)' }}>
                        Appellate Authority Order:
                      </span>
                      <p style={{ fontSize: '0.88rem', color: 'var(--color-neutral-900)', marginTop: '2px' }}>
                        {data.appeal.remarks}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Citizen Feedback Rating */}
          {(data.grievance.status === 'resolved' || data.grievance.status === 'rejected') && (
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{t('tracking.feedbackTitle')}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-neutral-600)', marginBottom: '14px' }}>
                {t('tracking.feedbackPrompt')}
              </p>

              {feedbackSubmitted ? (
                <div style={{ color: 'var(--color-status-resolved)', fontWeight: 600, fontSize: '0.9rem' }}>
                  <IconCheck size={16} /> Thank you for submitting your feedback ({rating} / 5 stars).
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`btn btn-sm ${rating >= star ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ minWidth: '42px', fontWeight: 700 }}
                      >
                        {star} ★
                      </button>
                    ))}
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Optional comments regarding resolution quality..."
                      value={feedbackComments}
                      onChange={(e) => setFeedbackComments(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-secondary btn-sm">
                    {t('tracking.submitFeedback')}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
