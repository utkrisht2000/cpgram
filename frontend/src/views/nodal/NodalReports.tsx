import React, { useState, useEffect } from 'react';
import { useI18n } from '../../locales/i18n';
import { officerApi } from '../../api/officerApi';
import { IconExport } from '../../assets/icons/Icons';

export const NodalReports: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    officerApi.getExportSummary()
      .then((res) => setData(res.exportData))
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  const handleExportCsv = () => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sugam_governance_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container" style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>{t('nav.reports')}</h2>
          <p style={{ marginTop: '4px', fontSize: '0.92rem', color: 'var(--color-neutral-600)' }}>
            Comprehensive departmental performance audit logs and case resolution export.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={data.length === 0}
          className="btn btn-primary"
        >
          <IconExport size={18} />
          <span>{t('nodal.exportSummary')} (CSV)</span>
        </button>
      </div>

      <div className="data-table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-neutral-500)' }}>
            {t('common.loading')}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Registration ID</th>
                <th>Complainant</th>
                <th>Department</th>
                <th>Category</th>
                <th>Status</th>
                <th>Priority</th>
                <th>SLA Risk</th>
                <th>Escalated</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{row.tracking_number}</td>
                  <td>{row.citizen_name}</td>
                  <td>{row.department}</td>
                  <td>{row.category}</td>
                  <td>
                    <span className={`badge badge-${row.status}`}>{row.status}</span>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{row.priority}</td>
                  <td style={{ textTransform: 'capitalize', color: row.sla_status === 'breached' ? '#dc2626' : 'inherit', fontWeight: row.sla_status === 'breached' ? 700 : 400 }}>
                    {row.sla_status}
                  </td>
                  <td>{row.is_escalated}</td>
                  <td>{new Date(row.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
