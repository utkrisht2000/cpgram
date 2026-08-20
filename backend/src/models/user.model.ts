import { db } from '../db/connection';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  language_preference: string;
  created_at: string;
  updated_at: string;
}

export const UserModel = {
  findByPhone(phone: string): User | undefined {
    return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as User | undefined;
  },

  findById(id: string): User | undefined {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
  },

  create(id: string, phone: string, name?: string | null, languagePreference: string = 'en'): User {
    db.prepare(`
      INSERT INTO users (id, phone, name, language_preference)
      VALUES (?, ?, ?, ?)
    `).run(id, phone, name || null, languagePreference);
    return this.findById(id)!;
  },

  updateLanguage(id: string, languagePreference: string): void {
    db.prepare(`
      UPDATE users SET language_preference = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(languagePreference, id);
  },

  updateName(id: string, name: string): void {
    db.prepare(`
      UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name, id);
  }
};
