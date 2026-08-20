import { db } from '../db/connection';

export interface Department {
  id: string;
  code: string;
  name_en: string;
  name_hi: string;
  description_en: string;
  description_hi: string;
  sla_days: number;
  active: number;
  created_at: string;
}

export const DepartmentModel = {
  findAll(): Department[] {
    return db.prepare('SELECT * FROM departments WHERE active = 1 ORDER BY name_en ASC').all() as Department[];
  },

  findById(id: string): Department | undefined {
    return db.prepare('SELECT * FROM departments WHERE id = ?').get(id) as Department | undefined;
  },

  findByCode(code: string): Department | undefined {
    return db.prepare('SELECT * FROM departments WHERE code = ?').get(code) as Department | undefined;
  },

  create(dept: Omit<Department, 'active' | 'created_at'>): void {
    db.prepare(`
      INSERT INTO departments (id, code, name_en, name_hi, description_en, description_hi, sla_days, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(dept.id, dept.code, dept.name_en, dept.name_hi, dept.description_en, dept.description_hi, dept.sla_days);
  }
};
