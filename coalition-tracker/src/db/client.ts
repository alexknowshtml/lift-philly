import { Database } from 'bun:sqlite';

let db: Database | null = null;

const DATABASE_PATH = process.env.DATABASE_PATH || '/data/liftphilly.db';

export function getDatabase(): Database {
  if (!db) {
    console.log(`Opening database at ${DATABASE_PATH}`);
    db = new Database(DATABASE_PATH);
    db.exec('PRAGMA journal_mode = WAL');

    // Create table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS coalition (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('organization', 'individual', 'business', 'elected_official')),
        contact_name TEXT,
        contact_email TEXT,
        website TEXT,
        notes TEXT,
        public_display INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active' CHECK(status IN ('prospect', 'contacted', 'active', 'inactive')),
        connected_via TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export interface CoalitionMember {
  id: number;
  name: string;
  type: 'organization' | 'individual' | 'business' | 'elected_official' | null;
  contact_name: string | null;
  contact_email: string | null;
  website: string | null;
  notes: string | null;
  public_display: number;
  status: 'prospect' | 'contacted' | 'active' | 'inactive';
  connected_via: string | null;
  created_at: string;
  updated_at: string;
}

export function getAllMembers(): CoalitionMember[] {
  const db = getDatabase();
  return db.query('SELECT * FROM coalition ORDER BY status, name').all() as CoalitionMember[];
}

export function getMemberById(id: number): CoalitionMember | null {
  const db = getDatabase();
  return db.query('SELECT * FROM coalition WHERE id = ?').get(id) as CoalitionMember | null;
}

export function createMember(member: Partial<CoalitionMember>): CoalitionMember {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO coalition (name, type, contact_name, contact_email, website, notes, public_display, status, connected_via)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    member.name || '',
    member.type || null,
    member.contact_name || null,
    member.contact_email || null,
    member.website || null,
    member.notes || null,
    member.public_display || 0,
    member.status || 'prospect',
    member.connected_via || null
  );
  return getMemberById(Number(result.lastInsertRowid))!;
}

export function updateMember(id: number, member: Partial<CoalitionMember>): CoalitionMember | null {
  const db = getDatabase();
  const existing = getMemberById(id);
  if (!existing) return null;

  const stmt = db.prepare(`
    UPDATE coalition SET
      name = ?,
      type = ?,
      contact_name = ?,
      contact_email = ?,
      website = ?,
      notes = ?,
      public_display = ?,
      status = ?,
      connected_via = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(
    member.name ?? existing.name,
    member.type ?? existing.type,
    member.contact_name ?? existing.contact_name,
    member.contact_email ?? existing.contact_email,
    member.website ?? existing.website,
    member.notes ?? existing.notes,
    member.public_display ?? existing.public_display,
    member.status ?? existing.status,
    member.connected_via ?? existing.connected_via,
    id
  );
  return getMemberById(id);
}

export function deleteMember(id: number): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM coalition WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getStats(): { total: number; active: number; prospect: number; contacted: number; inactive: number } {
  const db = getDatabase();
  const total = (db.query('SELECT COUNT(*) as count FROM coalition').get() as { count: number }).count;
  const active = (db.query("SELECT COUNT(*) as count FROM coalition WHERE status = 'active'").get() as { count: number }).count;
  const prospect = (db.query("SELECT COUNT(*) as count FROM coalition WHERE status = 'prospect'").get() as { count: number }).count;
  const contacted = (db.query("SELECT COUNT(*) as count FROM coalition WHERE status = 'contacted'").get() as { count: number }).count;
  const inactive = (db.query("SELECT COUNT(*) as count FROM coalition WHERE status = 'inactive'").get() as { count: number }).count;
  return { total, active, prospect, contacted, inactive };
}
