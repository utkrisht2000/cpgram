import React, { useState } from 'react';
import { useI18n } from '../../locales/i18n';
import { authApi, UserSession } from '../../api/authApi';
import { IconUser, IconCheck } from '../../assets/icons/Icons';

interface CitizenAuthProps {
  onSuccess: (user: UserSession, token: string) => void;
  onSwitchToOfficer: () => void;
}

export const CitizenAuth: React.FC<CitizenAuthProps> = ({ onSuccess, onSwitchToOfficer }) => {
  const { language, t } = useI18n();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setError(language === 'hi' ? 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.requestOtp(phone.trim());
      if (res.devOtp) {
        setDevOtp(res.devOtp);
      }
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp.trim()) {
      setError(language === 'hi' ? 'कृपया ओटीपी कोड दर्ज करें।' : 'Please enter the verification code.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.verifyOtp(phone.trim(), otp.trim(), name.trim() || undefined, language);
      localStorage.setItem('sugam_token', res.token);
      localStorage.setItem('sugam_user', JSON.stringify(res.user));
      onSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoPhone: string, demoName: string) => {
    setPhone(demoPhone);
    setName(demoName);
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
            <IconUser size={24} />
          </div>
          <h2>{t('auth.citizenLoginTitle')}</h2>
          <p style={{ marginTop: '6px', fontSize: '0.9rem' }}>{t('auth.citizenLoginSubtitle')}</p>
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

        {step === 'request' ? (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label htmlFor="phone-input" className="form-label">{t('auth.phoneLabel')}</label>
              <input
                id="phone-input"
                type="tel"
                className="form-input"
                placeholder={t('auth.phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="name-input" className="form-label">{t('auth.nameLabel')}</label>
              <input
                id="name-input"
                type="text"
                className="form-input"
                placeholder={t('auth.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="btn btn-primary btn-lg w-full"
              style={{ marginTop: '8px' }}
            >
              {loading ? t('common.loading') : t('auth.requestOtp')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div
              style={{
                backgroundColor: 'var(--color-primary-50)',
                border: '1px solid var(--color-primary-100)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '0.88rem',
              }}
            >
              <div>OTP sent to: <strong>+91 {phone}</strong></div>
              {devOtp && (
                <div style={{ marginTop: '6px', color: 'var(--color-accent-700)', fontWeight: 600 }}>
                  [Dev Testing OTP: {devOtp}]
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="otp-input" className="form-label">{t('auth.enterOtp')}</label>
              <input
                id="otp-input"
                type="text"
                className="form-input text-center"
                style={{ fontSize: '1.4rem', letterSpacing: '6px', fontWeight: 700 }}
                placeholder="------"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => { setStep('request'); setOtp(''); }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                {t('common.back')}
              </button>
              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="btn btn-primary"
                style={{ flex: 2 }}
              >
                {loading ? t('common.loading') : t('auth.verifyOtp')}
              </button>
            </div>
          </form>
        )}

        {/* Quick Demo Pre-fills */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-neutral-200)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-neutral-500)', display: 'block', marginBottom: '8px' }}>
            {t('auth.quickDemoAccounts')}:
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('9876543210', 'Ramesh Kumar')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start' }}
            >
              <IconCheck size={14} /> Ramesh Kumar (9876543210)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('9811223344', 'Sunita Devi')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start' }}
            >
              <IconCheck size={14} /> Sunita Devi (9811223344)
            </button>
          </div>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onSwitchToOfficer}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary-700)', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            {t('nav.officerPortal')} &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
