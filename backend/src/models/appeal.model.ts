import { db } from '../db/connection';

export type AppealStatus = 'submitted' | 'under_review' | 'upheld' | 'overturned';

export interface Appeal {
  id: string;
  grievance_id: string;
  user_id: string;
  reason: string;
  ai_draft_used: number;
  status: AppealStatus;
  remarks: string | null;
  appellate_officer_id: string | null;
  created_at: string;
  resolved_at: string | null;
  tracking_number?: string;
  department_name_en?: string;
  department_name_hi?: string;
  citizen_name?: string;
  citizen_phone?: string;
  appellate_officer_name?: string;
}

export const AppealModel = {
  findById(id: string): Appeal | undefined {
    return db.prepare(`
      SELECT a.*, g.tracking_number, d.name_en as department_name_en, d.name_hi as department_name_hi,
             u.name as citizen_name, u.phone as citizen_phone, o.name as appellate_officer_name
      FROM appeals a
      JOIN grievances g ON a.grievance_id = g.id
      JOIN departments d ON g.department_id = d.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN officers o ON a.appellate_officer_id = o.id
      WHERE a.id = ?
    `).get(id) as Appeal | undefined;
  },

  findByGrievanceId(grievanceId: string): Appeal | undefined {
    return db.prepare(`
      SELECT a.*, o.name as appellate_officer_name
      FROM appeals a
      LEFT JOIN officers o ON a.appellate_officer_id = o.id
      WHERE a.grievance_id = ?
    `).get(grievanceId) as Appeal | undefined;
  },

  findAll(status?: AppealStatus): Appeal[] {
    let sql = `
      SELECT a.*, g.tracking_number, d.name_en as department_name_en, d.name_hi as department_name_hi,
             u.name as citizen_name, u.phone as citizen_phone, o.name as appellate_officer_name
      FROM appeals a
      JOIN grievances g ON a.grievance_id = g.id
      JOIN departments d ON g.department_id = d.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN officers o ON a.appellate_officer_id = o.id
    `;
    const params: any[] = [];
    if (status) {
      sql += ` WHERE a.status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY a.created_at DESC`;
    return db.prepare(sql).all(...params) as Appeal[];
  },

  create(a: Omit<Appeal, 'created_at' | 'resolved_at' | 'tracking_number' | 'department_name_en' | 'department_name_hi' | 'citizen_name' | 'citizen_phone' | 'appellate_officer_name'>): Appeal {
    db.prepare(`
      INSERT INTO appeals (id, grievance_id, user_id, reason, ai_draft_used, status, remarks, appellate_officer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(a.id, a.grievance_id, a.user_id, a.reason, a.ai_draft_used, a.status, a.remarks || null, a.appellate_officer_id || null);
    return this.findById(a.id)!;
  },

  updateStatus(id: string, status: AppealStatus, remarks: string, appellateOfficerId: string): void {
    db.prepare(`
      UPDATE appeals
      SET status = ?, remarks = ?, appellate_officer_id = ?, resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, remarks, appellateOfficerId, id);
  }
};
