import { db } from '../db/connection';

export type GrievanceStatus = 
  | 'submitted' 
  | 'acknowledged' 
  | 'in_progress' 
  | 'info_requested' 
  | 'resolved' 
  | 'rejected' 
  | 'appealed';

export type GrievancePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Grievance {
  id: string;
  tracking_number: string;
  user_id: string;
  department_id: string;
  category: string;
  raw_text: string;
  clarified_text: string | null;
  language: string;
  status: GrievanceStatus;
  priority: GrievancePriority;
  photo_url: string | null;
  sla_deadline: string;
  is_escalated: number;
  ai_classification_confidence: number | null;
  ai_reasoning: string | null;
  resolution_summary: string | null;
  citizen_feedback_rating: number | null;
  citizen_feedback_comments: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  department_name_en?: string;
  department_name_hi?: string;
  citizen_name?: string;
  citizen_phone?: string;
}

export interface GrievanceFilter {
  userId?: string;
  departmentId?: string;
  status?: GrievanceStatus;
  isEscalated?: boolean;
  priority?: GrievancePriority;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

export const GrievanceModel = {
  findById(id: string): Grievance | undefined {
    return db.prepare(`
      SELECT g.*, d.name_en as department_name_en, d.name_hi as department_name_hi,
             u.name as citizen_name, u.phone as citizen_phone
      FROM grievances g
      LEFT JOIN departments d ON g.department_id = d.id
      LEFT JOIN users u ON g.user_id = u.id
      WHERE g.id = ?
    `).get(id) as Grievance | undefined;
  },

  findByTrackingNumber(trackingNumber: string): Grievance | undefined {
    return db.prepare(`
      SELECT g.*, d.name_en as department_name_en, d.name_hi as department_name_hi,
             u.name as citizen_name, u.phone as citizen_phone
      FROM grievances g
      LEFT JOIN departments d ON g.department_id = d.id
      LEFT JOIN users u ON g.user_id = u.id
      WHERE g.tracking_number = ?
    `).get(trackingNumber) as Grievance | undefined;
  },

  findByUser(userId: string): Grievance[] {
    return db.prepare(`
      SELECT g.*, d.name_en as department_name_en, d.name_hi as department_name_hi
      FROM grievances g
      LEFT JOIN departments d ON g.department_id = d.id
      WHERE g.user_id = ?
      ORDER BY g.created_at DESC
    `).all(userId) as Grievance[];
  },

  findMany(filters: GrievanceFilter): Grievance[] {
    let sql = `
      SELECT g.*, d.name_en as department_name_en, d.name_hi as department_name_hi,
             u.name as citizen_name, u.phone as citizen_phone
      FROM grievances g
      LEFT JOIN departments d ON g.department_id = d.id
      LEFT JOIN users u ON g.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.userId) {
      sql += ` AND g.user_id = ?`;
      params.push(filters.userId);
    }
    if (filters.departmentId) {
      sql += ` AND g.department_id = ?`;
      params.push(filters.departmentId);
    }
    if (filters.status) {
      sql += ` AND g.status = ?`;
      params.push(filters.status);
    }
    if (filters.isEscalated !== undefined) {
      sql += ` AND g.is_escalated = ?`;
      params.push(filters.isEscalated ? 1 : 0);
    }
    if (filters.priority) {
      sql += ` AND g.priority = ?`;
      params.push(filters.priority);
    }
    if (filters.startDate) {
      sql += ` AND g.created_at >= ?`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      sql += ` AND g.created_at <= ?`;
      params.push(filters.endDate);
    }
    if (filters.searchQuery) {
      sql += ` AND (g.tracking_number LIKE ? OR g.raw_text LIKE ? OR g.clarified_text LIKE ?)`;
      const q = `%${filters.searchQuery}%`;
      params.push(q, q, q);
    }

    // Sort by SLA urgency for actionable triage
    sql += ` ORDER BY g.is_escalated DESC, g.sla_deadline ASC, g.created_at DESC`;

    return db.prepare(sql).all(...params) as Grievance[];
  },

  create(g: Omit<Grievance, 'created_at' | 'updated_at' | 'resolved_at' | 'department_name_en' | 'department_name_hi' | 'citizen_name' | 'citizen_phone'>): Grievance {
    db.prepare(`
      INSERT INTO grievances (
        id, tracking_number, user_id, department_id, category, raw_text,
        clarified_text, language, status, priority, photo_url, sla_deadline,
        is_escalated, ai_classification_confidence, ai_reasoning
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      g.id, g.tracking_number, g.user_id, g.department_id, g.category, g.raw_text,
      g.clarified_text || null, g.language, g.status, g.priority, g.photo_url || null,
      g.sla_deadline, g.is_escalated, g.ai_classification_confidence || null, g.ai_reasoning || null
    );
    return this.findById(g.id)!;
  },

  updateStatus(id: string, status: GrievanceStatus, resolutionSummary?: string | null): void {
    const isResolved = status === 'resolved' || status === 'rejected';
    db.prepare(`
      UPDATE grievances
      SET status = ?,
          resolution_summary = COALESCE(?, resolution_summary),
          resolved_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE resolved_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, resolutionSummary || null, isResolved ? 1 : 0, id);
  },

  updateDepartment(id: string, departmentId: string): void {
    db.prepare(`
      UPDATE grievances
      SET department_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(departmentId, id);
  },

  setEscalated(id: string, isEscalated: boolean): void {
    db.prepare(`
      UPDATE grievances
      SET is_escalated = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(isEscalated ? 1 : 0, id);
  },

  submitFeedback(id: string, rating: number, comments?: string): void {
    db.prepare(`
      UPDATE grievances
      SET citizen_feedback_rating = ?, citizen_feedback_comments = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(rating, comments || null, id);
  }
};
