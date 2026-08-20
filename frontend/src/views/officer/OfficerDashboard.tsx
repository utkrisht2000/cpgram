import React, { useState, useEffect } from 'react';
import { useI18n } from '../../locales/i18n';
import { officerApi } from '../../api/officerApi';
import { departmentApi, DepartmentItem } from '../../api/departmentApi';
import { SlaBadge } from '../../components/common/SlaBadge';
import { IconFilter, IconSearch, IconChevronRight } from '../../assets/icons/Icons';
import { UserSession } from '../../api/authApi';

interface OfficerDashboardProps {
  user: UserSession;
  onSelectCase: (grievanceId: string) => void;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({ user, onSelectCase }) => {
  const { language, t } = useI18n();
  const [grievances, setGrievances] = useState<any[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [isEscalatedFilter, setIsEscalatedFilter] = useState<boolean | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchTriage = async () => {
    setLoading(true);
    try {
      const res = await officerApi.getTriageQueue({
        status: statusFilter || undefined,
        departmentId: departmentFilter || undefined,
        priority: priorityFilter || undefined,
        isEscalated: isEscalatedFilter,
        searchQuery: searchQuery || undefined,
      });
      setGrievances(res.grievances);
    } catch (err) {
      console.warn('[SuGam Triage] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    departmentApi.getAll().then((res) => setDepartments(res.departments)).catch(console.warn);
  }, []);

  useEffect(() => {
    fetchTriage();
  }, [statusFilter, departmentFilter, priorityFilter, isEscalatedFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTriage();
  };

  return (
    <div className="container" style={{ marginTop: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2>{t('officer.triageTitle')}</h2>
        <p style={{ marginTop: '4px', fontSize: '0.92rem', color: 'var(--color-neutral-600)' }}>
          {t('officer.triageSubtitle')}
        </p>
      </div>

      {/* Filter Control Bar */}
      <div className="card" style={{ padding: '18px', marginBottom: '20px' }}>
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-4" style={{ gap: '12px', alignItems: 'flex-end' }}>
            {/* Search */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Search</label>
              <input
                type="text"
                className="form-input"
                style={{ height: '38px', minHeight: '38px', fontSize: '0.88rem' }}
                placeholder={t('officer.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>{t('officer.filterStatus')}</label>
              <select
                className="form-select"
                style={{ height: '38px', minHeight: '38px', fontSize: '0.88rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in_progress">In Progress</option>
                <option value="info_requested">Info Requested</option>
                <option value="resolved">Resolved</option>
                <option value="appealed">Appealed</option>
              </select>
            </div>

            {/* Department Filter (Visible for Nodal or unassigned) */}
            {user.role === 'nodal_officer' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>{t('officer.filterDept')}</label>
                <select
                  className="form-select"
                  style={{ height: '38px', minHeight: '38px', fontSize: '0.88rem' }}
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === 'hi' ? d.name_hi : d.name_en}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority Filter */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>{t('officer.filterPriority')}</label>
              <select
                className="form-select"
                style={{ height: '38px', minHeight: '38px', fontSize: '0.88rem' }}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--color-neutral-100)' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isEscalatedFilter === true}
                onChange={(e) => setIsEscalatedFilter(e.target.checked ? true : undefined)}
              />
              <span style={{ fontWeight: 600, color: '#dc2626' }}>{t('officer.filterEscalated')}</span>
            </label>

            <button type="submit" className="btn btn-primary btn-sm">
              <IconSearch size={14} /> Filter Queue
            </button>
          </div>
        </form>
      </div>

      {/* Triage Data Table */}
      <div className="data-table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-neutral-500)' }}>
            {t('common.loading')}
          </div>
        ) : grievances.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-neutral-500)' }}>
            {t('common.noRecords')}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Registration ID</th>
                <th>Citizen</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>SLA Deadline / Risk</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {grievances.map((g) => {
                const deptName = language === 'hi' ? g.department_name_hi : g.department_name_en;
                return (
                  <tr
                    key={g.id}
                    onClick={() => onSelectCase(g.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary-900)' }}>
                          {g.tracking_number}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
                          {new Date(g.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{g.citizen_name || 'Citizen'}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-neutral-500)' }}>{g.citizen_phone || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '240px' }}>
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {g.category}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
                          {deptName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor:
                            g.priority === 'urgent'
                              ? '#fee2e2'
                              : g.priority === 'high'
                              ? '#ffedd5'
                              : 'var(--color-neutral-100)',
                          color:
                            g.priority === 'urgent'
                              ? '#dc2626'
                              : g.priority === 'high'
                              ? '#c2410c'
                              : 'var(--color-neutral-700)',
                        }}
                      >
                        {g.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${g.status}`}>
                        {t(`status.${g.status}`, g.status)}
                      </span>
                      {g.is_escalated === 1 && (
                        <span style={{ display: 'block', color: '#dc2626', fontSize: '0.7rem', fontWeight: 700, marginTop: '2px' }}>
                          ESCALATED
                        </span>
                      )}
                    </td>
                    <td>
                      <SlaBadge sla={g.sla} />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSelectCase(g.id); }}
                        className="btn btn-secondary btn-sm"
                      >
                        <span>{t('common.view')}</span>
                        <IconChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
