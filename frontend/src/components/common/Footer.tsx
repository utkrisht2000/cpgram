import React from 'react';
import { useI18n } from '../../locales/i18n';
import {
  SuGamLogo,
  IconMapPin,
  IconMail,
  IconPhone,
  IconTwitter,
  IconLinkedIn,
  IconYouTube,
  IconGitHub,
  IconChevronRight
} from '../../assets/icons/Icons';

interface FooterProps {
  onNavigate?: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useI18n();

  const handleNav = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="site-footer">
      <div className="container" style={{ paddingTop: '20px', paddingBottom: '30px' }}>
        <div
          className="grid grid-cols-4"
          style={{
            gap: '32px',
            marginBottom: '36px',
            borderBottom: '1px solid var(--color-neutral-800)',
            paddingBottom: '32px',
          }}
        >
          {/* Column 1: Brand & Identity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ filter: 'brightness(0) invert(1)', width: '160px' }}>
              <SuGamLogo height={34} />
            </div>
            <p style={{ color: 'var(--color-neutral-400)', fontSize: '0.85rem', lineHeight: '1.5' }}>
              SuGam is a digital governance platform connecting citizens with municipal and state departments for transparent, SLA-bound civic grievance redressal.
            </p>
            {/* Social Media Channels */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                style={{
                  color: 'var(--color-neutral-300)',
                  backgroundColor: 'var(--color-neutral-800)',
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                <IconTwitter size={18} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                style={{
                  color: 'var(--color-neutral-300)',
                  backgroundColor: 'var(--color-neutral-800)',
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                <IconLinkedIn size={18} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                style={{
                  color: 'var(--color-neutral-300)',
                  backgroundColor: 'var(--color-neutral-800)',
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                <IconYouTube size={18} />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
                style={{
                  color: 'var(--color-neutral-300)',
                  backgroundColor: 'var(--color-neutral-800)',
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                <IconGitHub size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 style={{ color: 'var(--color-white)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', letterSpacing: '0.5px' }}>
              Citizen Portals & Services
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', padding: 0 }}>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('file_grievance')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-neutral-300)', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconChevronRight size={12} /> {t('nav.fileGrievance')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('track_status')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-neutral-300)', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconChevronRight size={12} /> {t('nav.trackStatus')} (Public Tracker)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('citizen_login')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-neutral-300)', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconChevronRight size={12} /> Citizen OTP Login
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('officer_login')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-neutral-300)', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconChevronRight size={12} /> Department Staff & Nodal Login
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Redressal Departments */}
          <div>
            <h4 style={{ color: 'var(--color-white)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', letterSpacing: '0.5px' }}>
              Redressal Departments
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', padding: 0, color: 'var(--color-neutral-400)' }}>
              <li>• Municipal Water Supply & Sewerage</li>
              <li>• Electricity Distribution Corporation</li>
              <li>• Public Works & Urban Roadways</li>
              <li>• Social Welfare & Pension Schemes</li>
              <li>• Public Health & Urban Sanitation</li>
              <li>• Food & Civil Supplies (PDS)</li>
            </ul>
          </div>

          {/* Column 4: Administrative Address & Contact */}
          <div>
            <h4 style={{ color: 'var(--color-white)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', letterSpacing: '0.5px' }}>
              Public Helpdesk & Address
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: 'var(--color-neutral-300)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <IconMapPin size={18} style={{ flexShrink: 0, color: 'var(--color-primary-500)', marginTop: '2px' }} />
                <span>
                  Administrative Governance Centre, Block IV, Civic Tower Complex, New Delhi 110001
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconPhone size={18} style={{ flexShrink: 0, color: 'var(--color-primary-500)' }} />
                <span>Toll-Free Helpline: <strong>1800-11-2026</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconMail size={18} style={{ flexShrink: 0, color: 'var(--color-primary-500)' }} />
                <span>Email: <strong>support@sugam.local</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Required Single-Line Attribution */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.82rem',
            color: 'var(--color-neutral-400)',
          }}
        >
          <div>
            © {new Date().getFullYear()} SuGam Platform. All rights reserved.
          </div>

          <p className="footer-attribution" style={{ margin: 0 }}>
            {t('app.footerAttribution')}
          </p>

          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Accessibility Statement</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
