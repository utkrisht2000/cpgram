import { db } from '../connection';
import bcrypt from 'bcryptjs';

const INITIAL_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  language_preference TEXT DEFAULT 'en',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otps (
  phone TEXT PRIMARY KEY,
  otp_hash TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_hi TEXT NOT NULL,
  sla_days INTEGER NOT NULL DEFAULT 15,
  active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS officers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('redressal_officer', 'nodal_officer')),
  department_id TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS grievances (
  id TEXT PRIMARY KEY,
  tracking_number TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  department_id TEXT NOT NULL,
  category TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  clarified_text TEXT,
  language TEXT DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'acknowledged', 'in_progress', 'info_requested', 'resolved', 'rejected', 'appealed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  photo_url TEXT,
  sla_deadline DATETIME NOT NULL,
  is_escalated INTEGER NOT NULL DEFAULT 0,
  ai_classification_confidence REAL,
  ai_reasoning TEXT,
  resolution_summary TEXT,
  citizen_feedback_rating INTEGER,
  citizen_feedback_comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS status_history (
  id TEXT PRIMARY KEY,
  grievance_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  remarks TEXT,
  changed_by_type TEXT NOT NULL CHECK (changed_by_type IN ('citizen', 'officer', 'nodal', 'system')),
  changed_by_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grievance_notes (
  id TEXT PRIMARY KEY,
  grievance_id TEXT NOT NULL,
  officer_id TEXT NOT NULL,
  note_type TEXT NOT NULL CHECK (note_type IN ('internal', 'citizen_query', 'resolution')),
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE,
  FOREIGN KEY (officer_id) REFERENCES officers(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  grievance_id TEXT,
  title_en TEXT NOT NULL,
  title_hi TEXT NOT NULL,
  message_en TEXT NOT NULL,
  message_hi TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appeals (
  id TEXT PRIMARY KEY,
  grievance_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  ai_draft_used INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'upheld', 'overturned')),
  remarks TEXT,
  appellate_officer_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (appellate_officer_id) REFERENCES officers(id)
);

CREATE INDEX IF NOT EXISTS idx_grievances_user ON grievances(user_id);
CREATE INDEX IF NOT EXISTS idx_grievances_department ON grievances(department_id);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_deadline ON grievances(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_status_history_grievance ON status_history(grievance_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
`;

const INITIAL_DEPARTMENTS = [
  { id: 'dept-001', code: 'WATER', name_en: 'Municipal Water Supply & Sewerage', name_hi: 'नगर जल आपूर्ति एवं सीवरेज बोर्ड', description_en: 'Drinking water pipeline contamination, low water pressure, sewer line choke, and billing disputes.', description_hi: 'पेयजल पाइपलाइन संदूषण, कम जल दबाव, सीवर लाइन जाम और बिलिंग विवाद।', sla_days: 7 },
  { id: 'dept-002', code: 'POWER', name_en: 'Electricity Distribution Corporation', name_hi: 'विद्युत वितरण निगम लिमिटेड', description_en: 'Power transformer faults, frequent voltage fluctuations, broken electrical poles, and meter errors.', description_hi: 'ट्रांसफार्मर खराबी, वोल्टेज में उतार-चढ़ाव, टूटे बिजली के खंभे और मीटर त्रुटियां।', sla_days: 5 },
  { id: 'dept-003', code: 'ROADS', name_en: 'Public Works & Urban Roadways', name_hi: 'लोक निर्माण एवं नगरीय सड़क विभाग', description_en: 'Deep road potholes, broken storm-water drains, missing manhole covers, and street paving.', description_hi: 'सड़कों के गहरे गड्ढे, टूटी नालियां, खुले मैनहोल और सड़क निर्माण।', sla_days: 15 },
  { id: 'dept-004', code: 'WELFARE', name_en: 'Social Welfare & Pension Schemes', name_hi: 'समाज कल्याण एवं पेंशन संभाग', description_en: 'Old age pensions, widow assistance, disability benefits, and Direct Benefit Transfer (DBT) verification.', description_hi: 'वृद्धावस्था पेंशन, विधवा सहायता, दिव्यांगजन लाभ और प्रत्यक्ष लाभ अंतरण (DBT) सत्यापन।', sla_days: 21 },
  { id: 'dept-005', code: 'HEALTH', name_en: 'Public Health & Urban Sanitation', name_hi: 'जन स्वास्थ्य एवं नगर स्वच्छता संभाग', description_en: 'Garbage dump clearance, mosquito fogging, public toilet sanitation, and civic hygiene.', description_hi: 'कचरा डंप की सफाई, मच्छर रोधी फॉगिंग, सार्वजनिक शौचालय स्वच्छता और नागरिक स्वच्छता।', sla_days: 3 },
  { id: 'dept-006', code: 'FOOD', name_en: 'Food & Civil Supplies (PDS)', name_hi: 'खाद्य एवं नागरिक आपूर्ति विभाग', description_en: 'Ration card issuance, fair price shop irregularities, grain quality grievances, and quota allocations.', description_hi: 'राशन कार्ड जारी करना, उचित दर दुकान की अनियमितताएं और खाद्यान्न गुणवत्ता शिकायतें।', sla_days: 10 },
  { id: 'dept-007', code: 'TRANSPORT', name_en: 'Urban Transport & Road Safety', name_hi: 'नगरीय परिवहन एवं सड़क सुरक्षा प्राधिकरण', description_en: 'City bus routing, broken bus shelters, malfunctioning traffic lights, and public transport safety.', description_hi: 'नगर बस मार्ग, टूटे बस शेल्टर, खराब ट्रैफिक लाइट और सार्वजनिक परिवहन सुरक्षा।', sla_days: 7 },
  { id: 'dept-008', code: 'REVENUE', name_en: 'Revenue & Land Records Administration', name_hi: 'राजस्व एवं भू-अभिलेख प्रशासन', description_en: 'Property mutation delays, demarcation disputes, land record corrections, and certificate issuance.', description_hi: 'दाखिल खारिज (म्यूटेशन) में देरी, भूमि सीमांकन विवाद, भू-अभिलेख सुधार और प्रमाण पत्र।', sla_days: 30 },
];

export function runMigrations(): void {
  // 1. Execute SQL DDL migrations
  db.exec(INITIAL_SCHEMA_SQL);

  // 2. Auto-seed departments if empty
  const deptCount = (db.prepare('SELECT count(*) as count FROM departments').get() as any).count;
  if (deptCount === 0) {
    const insertDept = db.prepare(`
      INSERT INTO departments (id, code, name_en, name_hi, description_en, description_hi, sla_days)
      VALUES (@id, @code, @name_en, @name_hi, @description_en, @description_hi, @sla_days)
    `);
    db.transaction(() => {
      for (const d of INITIAL_DEPARTMENTS) {
        insertDept.run(d);
      }
    })();
  }

  // 3. Auto-seed officers if empty
  const offCount = (db.prepare('SELECT count(*) as count FROM officers').get() as any).count;
  if (offCount === 0) {
    const officerHash = bcrypt.hashSync('Officer@123', 10);
    const nodalHash = bcrypt.hashSync('Nodal@123', 10);

    const insertOfficer = db.prepare(`
      INSERT INTO officers (id, email, password_hash, name, role, department_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      insertOfficer.run('off-001', 'officer.water@sugam.local', officerHash, 'Anil Verma', 'redressal_officer', 'dept-001');
      insertOfficer.run('off-002', 'officer.power@sugam.local', officerHash, 'Vikram Malhotra', 'redressal_officer', 'dept-002');
      insertOfficer.run('off-003', 'officer.roads@sugam.local', officerHash, 'Sanjay Gupta', 'redressal_officer', 'dept-003');
      insertOfficer.run('off-004', 'officer.welfare@sugam.local', officerHash, 'Pooja Rawat', 'redressal_officer', 'dept-004');
      insertOfficer.run('off-005', 'nodal.admin@sugam.local', nodalHash, 'Dr. Rajesh Sharma (IAS)', 'nodal_officer', null);
    })();
  }

  // 4. Auto-seed mock citizen & sample grievances if empty
  const userCount = (db.prepare('SELECT count(*) as count FROM users').get() as any).count;
  if (userCount === 0) {
    db.prepare(`
      INSERT INTO users (id, phone, name, language_preference)
      VALUES ('usr-001', '9876543210', 'Ramesh Kumar', 'en')
    `).run();

    const now = Date.now();
    const insertGrv = db.prepare(`
      INSERT INTO grievances (id, tracking_number, user_id, department_id, category, raw_text, clarified_text, language, status, priority, sla_deadline, is_escalated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      insertGrv.run(
        'grv-001',
        'SGM-2026-1049',
        'usr-001',
        'dept-001',
        'Contaminated Tap Water & Pipeline Leakage',
        'Drinking water has been muddy and smelling strongly of sewage for the past 3 days in Ward 14.',
        'Complainant reports supply of muddy, sewage-contaminated drinking water across Ward 14, causing urgent public health risk.',
        'en',
        'in_progress',
        'urgent',
        new Date(now + 86400000 * 4).toISOString(),
        0,
        new Date(now - 86400000 * 2).toISOString()
      );

      db.prepare(`
        INSERT INTO status_history (id, grievance_id, from_status, to_status, remarks, changed_by_type, changed_by_id)
        VALUES ('sth-001', 'grv-001', NULL, 'submitted', 'Grievance submitted by citizen.', 'citizen', 'usr-001')
      `).run();
      db.prepare(`
        INSERT INTO status_history (id, grievance_id, from_status, to_status, remarks, changed_by_type, changed_by_id)
        VALUES ('sth-002', 'grv-001', 'submitted', 'in_progress', 'Assigned to field engineer for water testing and pipeline repair.', 'officer', 'off-001')
      `).run();
    })();
  }
}
