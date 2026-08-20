import React, { useState } from 'react';
import { useI18n } from '../../locales/i18n';
import { authApi, UserSession } from '../../api/authApi';
import { IconShield, IconCheck } from '../../assets/icons/Icons';

interface OfficerAuthProps {
  onSuccess: (user: UserSession, token: string) => void;
  onSwitchToCitizen: () => void;
}

export const OfficerAuth: React.FC<OfficerAuthProps> = ({ onSuccess, onSwitchToCitizen }) => {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.officerLogin(email.trim(), password);
      localStorage.setItem('sugam_token', res.token);
      localStorage.setItem('sugam_user', JSON.stringify(res.user));
      onSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Invalid official login credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="container" style={{ maxWidth: '480px', marginTop: '20px' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-100)',
              color: 'var(--color-primary-800)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <IconShield size={24} />
          </div>
          <h2>{t('auth.officerLoginTitle')}</h2>
          <p style={{ marginTop: '6px', fontSize: '0.9rem' }}>{t('auth.officerLoginSubtitle')}</p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-status-rejected-bg)',
              color: 'var(--color-status-rejected)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              fontSize: '0.88rem',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email-input" className="form-label">{t('auth.emailLabel')}</label>
            <input
              id="email-input"
              type="email"
              className="form-input"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password-input" className="form-label">{t('auth.passwordLabel')}</label>
            <input
              id="password-input"
              type="password"
              className="form-input"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="btn btn-primary btn-lg w-full"
            style={{ marginTop: '8px' }}
          >
            {loading ? t('common.loading') : t('auth.loginButton')}
          </button>
        </form>

        {/* Demo Quick-Fill Credentials */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-neutral-200)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-neutral-500)', display: 'block', marginBottom: '8px' }}>
            {t('auth.quickDemoAccounts')}:
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('officer.water@sugam.local', 'Officer@123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start' }}
            >
              <IconCheck size={14} /> {t('auth.waterOfficer')} (officer.water@sugam.local)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('officer.power@sugam.local', 'Officer@123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start' }}
            >
              <IconCheck size={14} /> {t('auth.powerOfficer')} (officer.power@sugam.local)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('nodal.admin@sugam.local', 'Nodal@123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start' }}
            >
              <IconCheck size={14} /> {t('auth.nodalOfficer')} (nodal.admin@sugam.local)
            </button>
          </div>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onSwitchToCitizen}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary-700)', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            &larr; {t('nav.citizenPortal')}
          </button>
        </div>
      </div>
    </div>
  );
};
