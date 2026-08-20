import React from 'react';
import { useI18n } from '../../locales/i18n';
import { StatusHistoryDto } from '../../api/grievanceApi';
import {
  IconStatusReceived,
  IconStatusInProgress,
  IconStatusResolved,
  IconStatusAppealed,
  IconCheck
} from '../../assets/icons/Icons';

interface TimelineStepperProps {
  history: StatusHistoryDto[];
  currentStatus: string;
}

export const TimelineStepper: React.FC<TimelineStepperProps> = ({ history, currentStatus }) => {
  const { t } = useI18n();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <IconStatusReceived size={18} />;
      case 'acknowledged':
      case 'in_progress':
        return <IconStatusInProgress size={18} />;
      case 'resolved':
        return <IconStatusResolved size={18} />;
      case 'appealed':
        return <IconStatusAppealed size={18} />;
      default:
        return <IconCheck size={18} />;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ position: 'relative', paddingLeft: '24px', margin: '20px 0' }}>
      {/* Vertical Track Line */}
      <div
        style={{
          position: 'absolute',
          left: '9px',
          top: '12px',
          bottom: '12px',
          width: '2px',
          backgroundColor: 'var(--color-neutral-300)',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {history.map((step, idx) => {
          const isLatest = idx === history.length - 1;
          const statusLabel = t(`status.${step.to_status}`, step.to_status);

          return (
            <div key={step.id || idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Stepper Dot */}
              <div
                style={{
                  position: 'absolute',
                  left: '-24px',
                  top: '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: isLatest ? 'var(--color-primary-600)' : 'var(--color-white)',
                  border: `2px solid ${isLatest ? 'var(--color-primary-600)' : 'var(--color-neutral-400)'}`,
                  color: isLatest ? 'var(--color-white)' : 'var(--color-neutral-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                }}
              >
                {getStatusIcon(step.to_status)}
              </div>

              {/* Event Content */}
              <div
                style={{
                  backgroundColor: isLatest ? 'var(--color-primary-50)' : 'var(--color-white)',
                  border: `1px solid ${isLatest ? 'var(--color-primary-100)' : 'var(--color-neutral-200)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-neutral-900)' }}>
                    {statusLabel}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-500)' }}>
                    {formatDate(step.created_at)}
                  </span>
                </div>

                {step.remarks && (
                  <p style={{ marginTop: '6px', fontSize: '0.9rem', color: 'var(--color-neutral-700)', lineHeight: '1.4' }}>
                    {step.remarks}
                  </p>
                )}

                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--color-neutral-500)', fontStyle: 'italic' }}>
                  Action by: {step.changed_by_name || step.changed_by_type}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
