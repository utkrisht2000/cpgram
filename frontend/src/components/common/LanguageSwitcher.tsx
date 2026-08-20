import React from 'react';
import { useI18n } from '../../locales/i18n';
import { IconLanguage } from '../../assets/icons/Icons';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useI18n();

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      <IconLanguage size={18} style={{ color: 'var(--color-neutral-600)' }} />
      <div style={{ display: 'inline-flex', borderRadius: 'var(--radius-md)', background: 'var(--color-neutral-100)', padding: '2px' }}>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          style={{
            padding: '0.35rem 0.65rem',
            fontSize: '0.82rem',
            fontWeight: language === 'en' ? 700 : 500,
            color: language === 'en' ? 'var(--color-primary-900)' : 'var(--color-neutral-600)',
            background: language === 'en' ? 'var(--color-white)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            boxShadow: language === 'en' ? 'var(--shadow-sm)' : 'none',
            minHeight: '34px',
          }}
          aria-label="Switch language to English"
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLanguage('hi')}
          style={{
            padding: '0.35rem 0.65rem',
            fontSize: '0.85rem',
            fontWeight: language === 'hi' ? 700 : 500,
            color: language === 'hi' ? 'var(--color-primary-900)' : 'var(--color-neutral-600)',
            background: language === 'hi' ? 'var(--color-white)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            boxShadow: language === 'hi' ? 'var(--shadow-sm)' : 'none',
            minHeight: '34px',
          }}
          aria-label="भाषा बदलकर हिंदी करें"
        >
          हिंदी
        </button>
      </div>
    </div>
  );
};
