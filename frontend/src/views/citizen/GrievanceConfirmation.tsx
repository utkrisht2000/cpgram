import React, { useState } from 'react';
import { useI18n } from '../../locales/i18n';
import { IconCheck, IconSearch } from '../../assets/icons/Icons';

interface GrievanceConfirmationProps {
  trackingNumber: string;
  slaDays: number;
  slaDeadline: string;
  onTrack: (trackingNumber: string) => void;
  onFileAnother: () => void;
}

export const GrievanceConfirmation: React.FC<GrievanceConfirmationProps> = ({
  trackingNumber,
  slaDays,
  slaDeadline,
  onTrack,
  onFileAnother,
}) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const formattedDeadline = new Date(slaDeadline).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="container" style={{ maxWidth: '640px', marginTop: '30px' }}>
      <div className="card" style={{ textAlign: 'center', padding: '36px 24px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-status-resolved-bg)',
            color: 'var(--color-status-resolved)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <IconCheck size={32} />
        </div>

        <h2>{t('grievance.successTitle')}</h2>
        <p style={{ marginTop: '8px', color: 'var(--color-neutral-600)', fontSize: '0.95rem' }}>
          {t('grievance.keepTrackingNote')}
        </p>

        {/* Tracking Registration Card */}
        <div
          style={{
            margin: '28px 0',
            padding: '24px',
            backgroundColor: 'var(--color-neutral-50)',
            border: '2px dashed var(--color-primary-300)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-neutral-500)', fontWeight: 600 }}>
            {t('grievance.trackingId')}
          </span>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--color-primary-900)',
              letterSpacing: '2px',
              margin: '8px 0',
            }}
          >
            {trackingNumber}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-secondary btn-sm"
            style={{ margin: '0 auto' }}
          >
            <IconCheck size={14} />
            <span>{copied ? t('common.copied') : t('common.copy')}</span>
          </button>

          <div
            style={{
              marginTop: '18px',
              paddingTop: '14px',
              borderTop: '1px solid var(--color-neutral-200)',
              display: 'flex',
              justifyContent: 'space-around',
              fontSize: '0.88rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--color-neutral-500)', display: 'block' }}>{t('grievance.estimatedSla')}</span>
              <strong>{slaDays} {t('tracking.days')}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-neutral-500)', display: 'block' }}>Resolution Target</span>
              <strong>{formattedDeadline}</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onTrack(trackingNumber)}
            className="btn btn-primary btn-lg"
          >
            <IconSearch size={20} />
            <span>{t('grievance.viewTracking')}</span>
          </button>

          <button
            type="button"
            onClick={onFileAnother}
            className="btn btn-secondary btn-lg"
          >
            {t('grievance.fileAnother')}
          </button>
        </div>
      </div>
    </div>
  );
};
