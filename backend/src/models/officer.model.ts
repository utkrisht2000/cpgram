import { db } from '../db/connection';

export type OfficerRole = 'redressal_officer' | 'nodal_officer';

export interface Officer {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: OfficerRole;
  department_id: string | null;
  active: number;
  created_at: string;
}

export const OfficerModel = {
  findByEmail(email: string): Officer | undefined {
    return db.prepare('SELECT * FROM officers WHERE email = ? AND active = 1').get(email) as Officer | undefined;
  },

  findById(id: string): Officer | undefined {
    return db.prepare('SELECT * FROM officers WHERE id = ?').get(id) as Officer | undefined;
  },

  findByDepartment(departmentId: string): Officer[] {
    return db.prepare('SELECT * FROM officers WHERE department_id = ? AND active = 1').all(departmentId) as Officer[];
  },

  create(officer: Omit<Officer, 'active' | 'created_at'>): void {
    db.prepare(`
      INSERT INTO officers (id, email, password_hash, name, role, department_id, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(officer.id, officer.email, officer.password_hash, officer.name, officer.role, officer.department_id);
  }
};
