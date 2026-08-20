import React, { useState } from 'react';
import { useI18n } from '../../locales/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationDrawer } from './NotificationDrawer';
import { SuGamLogo, IconBell, IconUser, IconShield, IconMenu, IconX } from '../../assets/icons/Icons';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (view: string) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="container header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick(user?.role === 'redressal_officer' || user?.role === 'nodal_officer' ? 'officer_dashboard' : 'home')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
        >
          <SuGamLogo height={34} />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {(!user || user.role === 'citizen') && (
            <>
              <button
                type="button"
                onClick={() => handleNavClick('file_grievance')}
                className={`btn btn-sm ${activeView === 'file_grievance' ? 'btn-primary' : 'btn-outline'}`}
              >
                {t('nav.fileGrievance')}
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('track_status')}
                className={`btn btn-sm ${activeView === 'track_status' ? 'btn-primary' : 'btn-secondary'}`}
              >
                {t('nav.trackStatus')}
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => handleNavClick('my_grievances')}
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
                onClick={() => handleNavClick('officer_dashboard')}
                className={`btn btn-sm ${activeView === 'officer_dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              >
                {t('nav.triageQueue')}
              </button>

              {user.role === 'redressal_officer' && (
                <button
                  type="button"
                  onClick={() => handleNavClick('officer_performance')}
                  className={`btn btn-sm ${activeView === 'officer_performance' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {t('nav.performance')}
                </button>
              )}

              {user.role === 'nodal_officer' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavClick('nodal_dashboard')}
                    className={`btn btn-sm ${activeView === 'nodal_dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {t('nav.nodalDashboard')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick('nodal_reports')}
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
                style={{ width: '38px', height: '38px', minHeight: '38px', minWidth: '38px' }}
              >
                <IconBell size={18} />
              </button>
              <NotificationDrawer
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                onSelectGrievance={() => handleNavClick('my_grievances')}
              />
            </div>
          )}

          {/* Language Toggle */}
          <LanguageSwitcher />

          {/* User Account / Auth Actions */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                  {user.name || user.phone || user.email}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-primary-700)', textTransform: 'capitalize' }}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleNavClick('citizen_login')}
                className="btn btn-primary btn-sm"
              >
                <IconUser size={16} />
                <span>{t('nav.login')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('officer_login')}
                className="btn btn-outline btn-sm"
                title="Department Staff Portal"
              >
                <IconShield size={16} />
                <span>Staff</span>
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Header Actions */}
        <div className="mobile-header-actions" style={{ display: 'none', alignItems: 'center', gap: '10px' }}>
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="btn btn-secondary btn-icon-only"
            aria-label="Toggle mobile menu"
            style={{ width: '42px', height: '42px', minWidth: '42px', minHeight: '42px', padding: '8px' }}
          >
            {isMobileMenuOpen ? <IconX size={22} /> : <IconMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          className="mobile-nav-drawer"
          style={{
            backgroundColor: 'var(--color-white)',
            borderBottom: '2px solid var(--color-primary-800)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {user && (
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-neutral-100)', borderRadius: 'var(--radius-md)', marginBottom: '6px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.name || user.phone || user.email}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-700)', textTransform: 'capitalize' }}>
                {user.role.replace('_', ' ')}
              </div>
            </div>
          )}

          {(!user || user.role === 'citizen') && (
            <>
              <button
                type="button"
                onClick={() => handleNavClick('file_grievance')}
                className={`btn btn-lg w-full ${activeView === 'file_grievance' ? 'btn-primary' : 'btn-outline'}`}
                style={{ justifyContent: 'flex-start' }}
              >
                {t('nav.fileGrievance')}
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('track_status')}
                className={`btn btn-lg w-full ${activeView === 'track_status' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start' }}
              >
                {t('nav.trackStatus')}
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => handleNavClick('my_grievances')}
                  className={`btn btn-lg w-full ${activeView === 'my_grievances' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start' }}
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
                onClick={() => handleNavClick('officer_dashboard')}
                className={`btn btn-lg w-full ${activeView === 'officer_dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start' }}
              >
                {t('nav.triageQueue')}
              </button>

              {user.role === 'redressal_officer' && (
                <button
                  type="button"
                  onClick={() => handleNavClick('officer_performance')}
                  className={`btn btn-lg w-full ${activeView === 'officer_performance' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start' }}
                >
                  {t('nav.performance')}
                </button>
              )}

              {user.role === 'nodal_officer' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavClick('nodal_dashboard')}
                    className={`btn btn-lg w-full ${activeView === 'nodal_dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    {t('nav.nodalDashboard')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick('nodal_reports')}
                    className={`btn btn-lg w-full ${activeView === 'nodal_reports' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    {t('nav.reports')}
                  </button>
                </>
              )}
            </>
          )}

          <div style={{ borderTop: '1px solid var(--color-neutral-200)', paddingTop: '10px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {user ? (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="btn btn-danger btn-lg w-full"
              >
                {t('nav.logout')}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleNavClick('citizen_login')}
                  className="btn btn-primary btn-lg w-full"
                >
                  <IconUser size={18} />
                  <span>Citizen Login (OTP)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('officer_login')}
                  className="btn btn-outline btn-lg w-full"
                >
                  <IconShield size={18} />
                  <span>Department Staff / Nodal Login</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
