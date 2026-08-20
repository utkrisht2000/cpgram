import React, { useState, useEffect } from 'react';
import { useI18n } from '../../locales/i18n';
import { officerApi, NodalDashboardDto } from '../../api/officerApi';
import { AppealDto } from '../../api/grievanceApi';
import { Modal } from '../../components/common/Modal';
import { IconShield, IconCheck } from '../../assets/icons/Icons';

interface NodalDashboardProps {
  onSelectCase: (grievanceId: string) => void;
}

export const NodalDashboard: React.FC<NodalDashboardProps> = ({ onSelectCase }) => {
  const { language, t } = useI18n();
  const [data, setData] = useState<NodalDashboardDto | null>(null);
  const [appeals, setAppeals] = useState<AppealDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Appeal Decision Modal
  const [selectedAppeal, setSelectedAppeal] = useState<AppealDto | null>(null);
  const [appealDecision, setAppealDecision] = useState<'upheld' | 'overturned'>('overturned');
  const [appealRemarks, setAppealRemarks] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, appealsRes] = await Promise.all([
        officerApi.getNodalDashboard(),
        officerApi.getNodalAppeals(),
      ]);
      setData(dashRes);
      setAppeals(appealsRes.appeals);
    } catch (err) {
      console.warn('[SuGam Nodal] Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleDecideAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppeal || !appealRemarks.trim()) return;

    setSubmittingDecision(true);
    try {
      await officerApi.decideAppeal(selectedAppeal.id, appealDecision, appealRemarks.trim());
      setSelectedAppeal(null);
      setAppealRemarks('');
      fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to record appellate decision.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px', color: 'var(--color-neutral-500)' }}>
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2>{t('nodal.dashboardTitle')}</h2>
        <p style={{ marginTop: '4px', fontSize: '0.92rem', color: 'var(--color-neutral-600)' }}>
          {t('nodal.dashboardSubtitle')}
        </p>
      </div>

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-4">
            <div className="card" style={{ padding: '20px' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 700 }}>
                {t('nodal.totalReceived')}
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-900)', marginTop: '4px' }}>
                {data.overview.totalReceived}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-neutral-500)' }}>All-time registered</span>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 700 }}>
                {t('nodal.pendingCases')}
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-700)', marginTop: '4px' }}>
                {data.overview.totalPending}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-neutral-500)' }}>Under active processing</span>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#dc2626', fontWeight: 700 }}>
                {t('nodal.breachedCases')}
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                {data.overview.totalBreached}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#dc2626' }}>
                {data.overview.overallBreachRate}% breach rate
              </span>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#7e22ce', fontWeight: 700 }}>
                {t('nodal.appealsPending')}
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#7e22ce', marginTop: '4px' }}>
                {data.overview.totalAppealsPending}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#7e22ce' }}>Awaiting adjudication</span>
            </div>
          </div>

          {/* Departmental Performance Matrix */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>{t('nodal.deptBreakdown')}</h3>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Standard SLA</th>
                    <th>Total Cases</th>
                    <th>Resolved</th>
                    <th>Active Pending</th>
                    <th>Breached</th>
                    <th>Breach Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.departments.map((d) => {
                    const name = language === 'hi' ? d.departmentNameHi : d.departmentNameEn;
                    return (
                      <tr key={d.departmentId}>
                        <td>
                          <strong>{name}</strong>
                        </td>
                        <td>{d.slaDays} days</td>
                        <td>{d.total}</td>
                        <td style={{ color: 'var(--color-status-resolved)', fontWeight: 600 }}>{d.resolved}</td>
                        <td>{d.pending}</td>
                        <td style={{ color: d.breached > 0 ? '#dc2626' : 'inherit', fontWeight: d.breached > 0 ? 700 : 400 }}>
                          {d.breached}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              backgroundColor: d.breachRate > 0 ? '#fee2e2' : '#dcfce7',
                              color: d.breachRate > 0 ? '#dc2626' : '#15803d',
                            }}
                          >
                            {d.breachRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Appellate Review Queue */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>{t('nodal.appealsQueue')}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-neutral-500)', marginBottom: '16px' }}>
              Statutory first appeals filed by citizens against prior departmental resolutions.
            </p>

            {appeals.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: 'var(--color-neutral-500)' }}>
                No citizen appeals currently pending.
              </p>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Case Tracking ID</th>
                      <th>Citizen</th>
                      <th>Department</th>
                      <th>Appeal Reason</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appeals.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <button
                            type="button"
                            onClick={() => onSelectCase(a.grievance_id)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-primary-700)', fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {a.tracking_number}
                          </button>
                        </td>
                        <td>{a.citizen_name || 'Citizen'} ({a.citizen_phone || '-'})</td>
                        <td>{language === 'hi' ? a.department_name_hi : a.department_name_en}</td>
                        <td style={{ maxWidth: '300px' }}>
                          <span style={{ fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {a.reason}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${a.status === 'submitted' ? 'appealed' : a.status}`}>
                            {a.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {a.status === 'submitted' || a.status === 'under_review' ? (
                            <button
                              type="button"
                              onClick={() => { setSelectedAppeal(a); setAppealRemarks(''); }}
                              className="btn btn-primary btn-sm"
                            >
                              Adjudicate
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-500)' }}>
                              Concluded
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appellate Adjudication Modal */}
      {selectedAppeal && (
        <Modal
          isOpen={Boolean(selectedAppeal)}
          onClose={() => setSelectedAppeal(null)}
          title={`Appellate Judgment: ${selectedAppeal.tracking_number}`}
        >
          <form onSubmit={handleDecideAppeal}>
            <div style={{ marginBottom: '14px', padding: '10px 14px', backgroundColor: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-neutral-500)', fontWeight: 600 }}>Citizen Appeal Grounds:</span>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-neutral-900)', marginTop: '4px' }}>
                {selectedAppeal.reason}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Supervisory Appellate Decision *</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAppealDecision('overturned')}
                  className={`btn ${appealDecision === 'overturned' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  {t('nodal.overturnResolution')}
                </button>
                <button
                  type="button"
                  onClick={() => setAppealDecision('upheld')}
                  className={`btn ${appealDecision === 'upheld' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  {t('nodal.upholdResolution')}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reasoned Order Remarks *</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: '110px' }}
                placeholder="Enter formal directives, inspection re-assignment instructions, or justification..."
                value={appealRemarks}
                onChange={(e) => setAppealRemarks(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" onClick={() => setSelectedAppeal(null)} className="btn btn-secondary">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={submittingDecision || !appealRemarks.trim()} className="btn btn-primary">
                Issue Order
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
