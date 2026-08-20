import React from 'react';
import { useI18n } from '../../locales/i18n';
import { SlaStatusDto } from '../../api/grievanceApi';
import { IconClock, IconSlaWarning, IconCheck } from '../../assets/icons/Icons';

interface SlaBadgeProps {
  sla?: SlaStatusDto;
  showProgress?: boolean;
}

export const SlaBadge: React.FC<SlaBadgeProps> = ({ sla, showProgress = false }) => {
  const { language } = useI18n();

  if (!sla) return null;

  const text = language === 'hi' ? sla.humanReadableHi : sla.humanReadableEn;

  let pillClass = 'sla-pill-safe';
  let IconComponent = IconClock;

  if (sla.status === 'resolved') {
    pillClass = 'sla-pill-safe';
    IconComponent = IconCheck;
  } else if (sla.isBreached || sla.status === 'breached') {
    pillClass = 'sla-pill-breached';
    IconComponent = IconSlaWarning;
  } else if (sla.isWarning || sla.status === 'warning') {
    pillClass = 'sla-pill-warning';
    IconComponent = IconSlaWarning;
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
      <span className={`sla-pill ${pillClass}`}>
        <IconComponent size={16} />
        <span>{text}</span>
      </span>

      {showProgress && sla.status !== 'resolved' && (
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'var(--color-neutral-200)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginTop: '2px',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.max(5, sla.progressPercent))}%`,
              height: '100%',
              backgroundColor: sla.isBreached
                ? '#dc2626'
                : sla.isWarning
                ? '#d97706'
                : '#16a34a',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      )}
    </div>
  );
};
