import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "transcripts.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS transcripts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      source_type TEXT NOT NULL,
      plain_text TEXT NOT NULL,
      timestamps_text TEXT,
      language TEXT,
      duration INTEGER,
      created_at INTEGER NOT NULL
    )
  `);

  return db;
}

export interface Transcript {
  id: string;
  title: string;
  source: string;
  source_type: "file" | "url";
  plain_text: string;
  timestamps_text: string | null;
  language: string | null;
  duration: number | null;
  created_at: number;
}

export function insertTranscript(t: Transcript): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO transcripts (id, title, source, source_type, plain_text, timestamps_text, language, duration, created_at)
    VALUES (@id, @title, @source, @source_type, @plain_text, @timestamps_text, @language, @duration, @created_at)
  `).run(t);
}

export function getAllTranscripts(): Transcript[] {
  const db = getDb();
  return db.prepare(`SELECT * FROM transcripts ORDER BY created_at DESC`).all() as Transcript[];
}

export function getTranscript(id: string): Transcript | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM transcripts WHERE id = ?`).get(id) as Transcript | undefined;
}

export function deleteTranscript(id: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM transcripts WHERE id = ?`).run(id);
}
