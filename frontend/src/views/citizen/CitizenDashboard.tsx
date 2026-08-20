import React, { useState, useEffect } from 'react';
import { useI18n } from '../../locales/i18n';
import { grievanceApi, GrievanceDto } from '../../api/grievanceApi';
import { SlaBadge } from '../../components/common/SlaBadge';
import { IconSearch, IconChevronRight, IconCheck } from '../../assets/icons/Icons';

interface CitizenDashboardProps {
  onSelectGrievance: (trackingNumber: string) => void;
  onFileNew: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ onSelectGrievance, onFileNew }) => {
  const { language, t } = useI18n();
  const [grievances, setGrievances] = useState<GrievanceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    grievanceApi.getMyGrievances()
      .then((res) => setGrievances(res.grievances))
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  const filtered = grievances.filter((g) => {
    if (filterStatus !== 'all' && g.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        g.tracking_number.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.raw_text.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="container" style={{ marginTop: '20px' }}>
      {/* Header bar with CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>{t('nav.myGrievances')}</h2>
          <p style={{ marginTop: '4px', fontSize: '0.9rem', color: 'var(--color-neutral-600)' }}>
            Track resolution milestones, view handling departments, and submit appeals.
          </p>
        </div>

        <button
          type="button"
          onClick={onFileNew}
          className="btn btn-primary btn-lg"
        >
          <span>+ {t('nav.fileGrievance')}</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'submitted', 'in_progress', 'resolved', 'appealed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
              >
                {st === 'all' ? 'All Cases' : t(`status.${st}`, st)}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', height: '38px', minHeight: '38px', fontSize: '0.88rem' }}
              placeholder="Search tracking ID or issue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-neutral-400)' }}>
              <IconSearch size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Grievances List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-neutral-500)' }}>
          {t('common.loading')}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--color-neutral-500)', fontSize: '1rem' }}>{t('common.noRecords')}</p>
          <button
            type="button"
            onClick={onFileNew}
            className="btn btn-outline"
            style={{ marginTop: '16px' }}
          >
            {t('grievance.fileTitle')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map((g) => {
            const deptName = language === 'hi' ? g.department_name_hi : g.department_name_en;
            return (
              <div
                key={g.id}
                className="card card-hover"
                style={{ cursor: 'pointer', padding: '20px' }}
                onClick={() => onSelectGrievance(g.tracking_number)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--color-primary-900)', fontSize: '1.05rem' }}>
                        {g.tracking_number}
                      </span>
                      <span className={`badge badge-${g.status}`}>
                        {t(`status.${g.status}`, g.status)}
                      </span>
                      {g.is_escalated === 1 && (
                        <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', border: '1px solid #fca5a5' }}>
                          ESCALATED
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{g.category}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-neutral-600)' }}>
                      {deptName || 'Department'} • Filed on {new Date(g.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* SLA Badge */}
                  <div>
                    <SlaBadge sla={g.sla} showProgress={true} />
                  </div>
                </div>

                <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--color-neutral-700)', lineHeight: '1.4' }}>
                  {g.clarified_text || g.raw_text}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-neutral-100)' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-neutral-500)' }}>
                    Priority: <strong style={{ textTransform: 'capitalize' }}>{g.priority}</strong>
                  </span>

                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary-700)', fontWeight: 600, fontSize: '0.88rem' }}>
                    <span>{t('tracking.trackButton')}</span>
                    <IconChevronRight size={16} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
