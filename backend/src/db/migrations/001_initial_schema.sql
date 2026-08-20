-- SuGam Grievance Redressal Platform Database Schema
-- Version: 001_initial_schema

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
