import { db } from '../db/connection';

export interface GrievanceNote {
  id: string;
  grievance_id: string;
  officer_id: string;
  note_type: 'internal' | 'citizen_query' | 'resolution';
  content: string;
  created_at: string;
  officer_name?: string;
}

export const GrievanceNoteModel = {
  findByGrievance(grievanceId: string): GrievanceNote[] {
    return db.prepare(`
      SELECT gn.*, o.name as officer_name
      FROM grievance_notes gn
      JOIN officers o ON gn.officer_id = o.id
      WHERE gn.grievance_id = ?
      ORDER BY gn.created_at ASC
    `).all(grievanceId) as GrievanceNote[];
  },

  create(n: Omit<GrievanceNote, 'created_at' | 'officer_name'>): void {
    db.prepare(`
      INSERT INTO grievance_notes (id, grievance_id, officer_id, note_type, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(n.id, n.grievance_id, n.officer_id, n.note_type, n.content);
  }
};
