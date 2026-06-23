const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.GUARDIANLINK_DB_PATH || path.join(DATA_DIR, 'guardianlink.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'caregiver',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS responder_api_keys (
      id TEXT PRIMARY KEY,
      key_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      agency TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      photo_url TEXT,
      date_of_birth TEXT,
      conditions TEXT DEFAULT '[]',
      medications TEXT DEFAULT '[]',
      allergies TEXT DEFAULT '[]',
      emergency_contacts TEXT DEFAULT '[]',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      serial_number TEXT UNIQUE NOT NULL,
      patient_id TEXT,
      status TEXT NOT NULL DEFAULT 'inactive',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS responder_access_logs (
      id TEXT PRIMARY KEY,
      device_serial TEXT NOT NULL,
      patient_id TEXT,
      responder_info TEXT,
      access_type TEXT NOT NULL DEFAULT 'responder_api',
      accessed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
    CREATE INDEX IF NOT EXISTS idx_devices_serial ON devices(serial_number);
    CREATE INDEX IF NOT EXISTS idx_devices_patient ON devices(patient_id);
    CREATE INDEX IF NOT EXISTS idx_access_logs_device ON responder_access_logs(device_serial);
    CREATE INDEX IF NOT EXISTS idx_access_logs_accessed ON responder_access_logs(accessed_at);
  `);
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, closeDb };