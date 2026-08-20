import React, { useState, useEffect } from 'react';
import { useI18n } from '../../locales/i18n';
import { grievanceApi, NotificationDto } from '../../api/grievanceApi';
import { IconBell, IconCheck } from '../../assets/icons/Icons';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGrievance?: (trackingNumber?: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onSelectGrievance }) => {
  const { language, t } = useI18n();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await grievanceApi.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.warn('[SuGam Notifications] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAllRead = async () => {
    try {
      await grievanceApi.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '70px',
        right: '20px',
        width: '380px',
        maxWidth: 'calc(100vw - 40px)',
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--color-neutral-200)',
        zIndex: 200,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--color-neutral-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconBell size={18} style={{ color: 'var(--color-primary-800)' }} />
          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{t('nav.notifications')}</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={markAllRead}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '2px 8px', minHeight: '28px' }}
          >
            <IconCheck size={14} /> Mark all read
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--color-neutral-500)' }}
          >
            &times;
          </button>
        </div>
      </div>

      <div style={{ overflowY: 'auto', padding: '8px 16px', flex: 1 }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--color-neutral-500)' }}>{t('common.loading')}</p>
        ) : notifications.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--color-neutral-500)' }}>{t('common.noRecords')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map((n) => {
              const title = language === 'hi' ? n.title_hi : n.title_en;
              const message = language === 'hi' ? n.message_hi : n.message_en;
              return (
                <div
                  key={n.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: n.is_read ? 'var(--color-neutral-50)' : 'var(--color-primary-50)',
                    border: `1px solid ${n.is_read ? 'var(--color-neutral-200)' : 'var(--color-primary-100)'}`,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (onSelectGrievance && n.grievance_id) {
                      onSelectGrievance();
                      onClose();
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-neutral-900)' }}>
                      {title}
                    </span>
                    {!n.is_read && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary-600)' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '0.82rem', marginTop: '4px', color: 'var(--color-neutral-700)', lineHeight: '1.4' }}>
                    {message}
                  </p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-neutral-400)', marginTop: '4px', display: 'block' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
