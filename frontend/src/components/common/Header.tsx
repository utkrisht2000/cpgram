import React, { useState } from 'react';
import { useI18n } from '../../locales/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationDrawer } from './NotificationDrawer';
import { SuGamLogo, IconBell, IconUser, IconShield } from '../../assets/icons/Icons';
import { UserSession } from '../../api/authApi';

interface HeaderProps {
  user: UserSession | null;
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, activeView, onNavigate, onLogout }) => {
  const { t } = useI18n();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate(user?.role === 'redressal_officer' || user?.role === 'nodal_officer' ? 'officer_dashboard' : 'home')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <SuGamLogo height={38} />
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {(!user || user.role === 'citizen') && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('file_grievance')}
                className={`btn btn-sm ${activeView === 'file_grievance' ? 'btn-primary' : 'btn-outline'}`}
              >
                {t('nav.fileGrievance')}
              </button>

              <button
                type="button"
                onClick={() => onNavigate('track_status')}
                className={`btn btn-sm ${activeView === 'track_status' ? 'btn-primary' : 'btn-secondary'}`}
              >
                {t('nav.trackStatus')}
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => onNavigate('my_grievances')}
                  className={`btn btn-sm ${activeView === 'my_grievances' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {t('nav.myGrievances')}
                </button>
              )}
            </>
          )}

          {user && (user.role === 'redressal_officer' || user.role === 'nodal_officer') && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('officer_dashboard')}
                className={`btn btn-sm ${activeView === 'officer_dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              >
                {t('nav.triageQueue')}
              </button>

              {user.role === 'redressal_officer' && (
                <button
                  type="button"
                  onClick={() => onNavigate('officer_performance')}
                  className={`btn btn-sm ${activeView === 'officer_performance' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {t('nav.performance')}
                </button>
              )}

              {user.role === 'nodal_officer' && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('nodal_dashboard')}
                    className={`btn btn-sm ${activeView === 'nodal_dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {t('nav.nodalDashboard')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('nodal_reports')}
                    className={`btn btn-sm ${activeView === 'nodal_reports' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {t('nav.reports')}
                  </button>
                </>
              )}
            </>
          )}

          {/* Citizen Notifications Bell */}
          {user && user.role === 'citizen' && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="btn btn-secondary btn-icon-only"
                aria-label="Toggle notifications"
                style={{ width: '40px', height: '40px', minHeight: '40px', minWidth: '40px' }}
              >
                <IconBell size={20} />
              </button>
              <NotificationDrawer
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                onSelectGrievance={() => onNavigate('my_grievances')}
              />
            </div>
          )}

          {/* Language Toggle */}
          <LanguageSwitcher />

          {/* User Account / Auth Actions */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.82rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                  {user.name || user.phone || user.email}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-primary-700)', textTransform: 'capitalize' }}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem' }}
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => onNavigate('citizen_login')}
                className="btn btn-primary btn-sm"
              >
                <IconUser size={16} />
                <span>{t('nav.login')}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('officer_login')}
                className="btn btn-outline btn-sm"
                title="Department Staff Portal"
              >
                <IconShield size={16} />
                <span>Staff</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
