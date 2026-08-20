import { db } from '../db/connection';

export interface Notification {
  id: string;
  user_id: string;
  grievance_id: string | null;
  title_en: string;
  title_hi: string;
  message_en: string;
  message_hi: string;
  is_read: number;
  created_at: string;
}

export const NotificationModel = {
  findByUser(userId: string): Notification[] {
    return db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(userId) as Notification[];
  },

  create(n: Omit<Notification, 'is_read' | 'created_at'>): void {
    db.prepare(`
      INSERT INTO notifications (id, user_id, grievance_id, title_en, title_hi, message_en, message_hi, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(n.id, n.user_id, n.grievance_id || null, n.title_en, n.title_hi, n.message_en, n.message_hi);
  },

  markAllAsRead(userId: string): void {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
  },

  markAsRead(id: string, userId: string): void {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
  }
};
