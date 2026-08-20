import { db } from '../db/connection';

export type ChangedByType = 'citizen' | 'officer' | 'nodal' | 'system';

export interface StatusHistory {
  id: string;
  grievance_id: string;
  from_status: string | null;
  to_status: string;
  remarks: string | null;
  changed_by_type: ChangedByType;
  changed_by_id: string | null;
  created_at: string;
  changed_by_name?: string;
}

export const StatusHistoryModel = {
  findByGrievance(grievanceId: string): StatusHistory[] {
    return db.prepare(`
      SELECT sh.*,
             CASE
               WHEN sh.changed_by_type = 'officer' OR sh.changed_by_type = 'nodal' THEN o.name
               WHEN sh.changed_by_type = 'citizen' THEN u.name
               ELSE 'System Automation'
             END as changed_by_name
      FROM status_history sh
      LEFT JOIN officers o ON sh.changed_by_id = o.id
      LEFT JOIN users u ON sh.changed_by_id = u.id
      WHERE sh.grievance_id = ?
      ORDER BY sh.created_at ASC
    `).all(grievanceId) as StatusHistory[];
  },

  create(entry: Omit<StatusHistory, 'created_at' | 'changed_by_name'>): void {
    db.prepare(`
      INSERT INTO status_history (id, grievance_id, from_status, to_status, remarks, changed_by_type, changed_by_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(entry.id, entry.grievance_id, entry.from_status || null, entry.to_status, entry.remarks || null, entry.changed_by_type, entry.changed_by_id || null);
  }
};
