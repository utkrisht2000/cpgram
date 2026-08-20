import React, { useState, useEffect } from 'react';
import { useI18n } from '../../locales/i18n';
import { officerApi, OfficerPerformanceDto } from '../../api/officerApi';
import { IconCheck, IconClock, IconSlaWarning } from '../../assets/icons/Icons';

export const OfficerPerformance: React.FC = () => {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<OfficerPerformanceDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    officerApi.getPerformance()
      .then((res) => setMetrics(res.metrics))
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px', color: 'var(--color-neutral-500)' }}>
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '840px', marginTop: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2>{t('officer.performanceTitle')}</h2>
        <p style={{ fontSize: '0.92rem', color: 'var(--color-neutral-600)', marginTop: '4px' }}>
          Real-time analytics on departmental grievance resolution efficiency and statutory SLA adherence.
        </p>
      </div>

      {metrics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-3">
            <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
              <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 700 }}>
                {t('officer.totalHandled')}
              </span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-primary-900)', marginTop: '4px' }}>
                {metrics.totalCases}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-500)' }}>
                {metrics.resolvedCases} resolved • {metrics.pendingCases} active
              </span>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
              <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 700 }}>
                {t('officer.resolvedInSla')}
              </span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: metrics.slaCompliancePercent >= 80 ? 'var(--color-status-resolved)' : '#d97706', marginTop: '4px' }}>
                {metrics.slaCompliancePercent}%
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-500)' }}>
                Within target duration
              </span>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
              <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 700 }}>
                {t('officer.avgResolutionTime')}
              </span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-primary-800)', marginTop: '4px' }}>
                {metrics.avgResolutionDays} <span style={{ fontSize: '1rem', fontWeight: 500 }}>days</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-500)' }}>
                Average redressal turnaround
              </span>
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Compliance Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                  <span>Resolved within Target SLA</span>
                  <strong style={{ color: 'var(--color-status-resolved)' }}>{metrics.resolvedCases} cases</strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-neutral-200)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${metrics.totalCases > 0 ? (metrics.resolvedCases / metrics.totalCases) * 100 : 0}%`, height: '100%', backgroundColor: 'var(--color-status-resolved)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                  <span>Active SLA Breaches</span>
                  <strong style={{ color: '#dc2626' }}>{metrics.breachedCases} cases</strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-neutral-200)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${metrics.totalCases > 0 ? (metrics.breachedCases / metrics.totalCases) * 100 : 0}%`, height: '100%', backgroundColor: '#dc2626' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
