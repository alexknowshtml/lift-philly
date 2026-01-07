import { Database } from 'bun:sqlite';

let db: Database | null = null;

const DATABASE_PATH = process.env.DATABASE_PATH || '/data/liftphilly.db';

export function getDatabase(): Database {
  if (!db) {
    console.log(`Opening database at ${DATABASE_PATH}`);
    db = new Database(DATABASE_PATH);
    db.exec('PRAGMA journal_mode = WAL');

    // Create coalition table if it doesn't exist
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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER
      )
    `);

    // Add created_by/updated_by columns if they don't exist (migration)
    try {
      db.exec('ALTER TABLE coalition ADD COLUMN created_by INTEGER');
    } catch (e) { /* column already exists */ }
    try {
      db.exec('ALTER TABLE coalition ADD COLUMN updated_by INTEGER');
    } catch (e) { /* column already exists */ }

    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create audit_log table
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        member_id INTEGER NOT NULL,
        member_name TEXT,
        changes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create index for faster audit log queries
    db.exec('CREATE INDEX IF NOT EXISTS idx_audit_log_member ON audit_log(member_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)');
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
  created_by: number | null;
  updated_by: number | null;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  is_admin: number;
  created_at: string;
}

export interface Session {
  id: number;
  token: string;
  user_id: number;
  expires_at: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: number;
  user_id: number;
  action: 'create' | 'update' | 'delete';
  member_id: number;
  member_name: string | null;
  changes: string | null;
  timestamp: string;
  // Joined fields
  user_display_name?: string;
}

export function getAllMembers(): CoalitionMember[] {
  const db = getDatabase();
  return db.query('SELECT * FROM coalition ORDER BY status, name').all() as CoalitionMember[];
}

export function getMemberById(id: number): CoalitionMember | null {
  const db = getDatabase();
  return db.query('SELECT * FROM coalition WHERE id = ?').get(id) as CoalitionMember | null;
}

export function createMember(member: Partial<CoalitionMember>, userId?: number): CoalitionMember {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO coalition (name, type, contact_name, contact_email, website, notes, public_display, status, connected_via, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    member.connected_via || null,
    userId || null,
    userId || null
  );
  return getMemberById(Number(result.lastInsertRowid))!;
}

export function updateMember(id: number, member: Partial<CoalitionMember>, userId?: number): CoalitionMember | null {
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
      updated_by = ?,
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
    userId || null,
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

// ============ User Functions ============

export function getUserByUsername(username: string): User | null {
  const db = getDatabase();
  return db.query('SELECT * FROM users WHERE username = ?').get(username) as User | null;
}

export function getUserById(id: number): User | null {
  const db = getDatabase();
  return db.query('SELECT * FROM users WHERE id = ?').get(id) as User | null;
}

export function createUser(username: string, passwordHash: string, displayName: string, isAdmin: boolean = false): User {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, display_name, is_admin)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(username, passwordHash, displayName, isAdmin ? 1 : 0);
  return getUserById(Number(result.lastInsertRowid))!;
}

export function getAllUsers(): Omit<User, 'password_hash'>[] {
  const db = getDatabase();
  return db.query('SELECT id, username, display_name, is_admin, created_at FROM users ORDER BY display_name').all() as Omit<User, 'password_hash'>[];
}

export function deleteUser(id: number): boolean {
  const db = getDatabase();
  // Don't allow deleting the last admin
  const adminCount = (db.query('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get() as { count: number }).count;
  const user = getUserById(id);
  if (user?.is_admin && adminCount <= 1) {
    return false;
  }
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return result.changes > 0;
}

export function updateUserPassword(username: string, newPasswordHash: string): boolean {
  const db = getDatabase();
  const result = db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(newPasswordHash, username);
  return result.changes > 0;
}

// ============ Session Functions ============

const SESSION_DURATION_DAYS = 7;

export function createSession(userId: number): string {
  const db = getDatabase();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(token, userId, expiresAt);

  return token;
}

export function getSessionByToken(token: string): (Session & { user: Omit<User, 'password_hash'> }) | null {
  const db = getDatabase();
  const session = db.query(`
    SELECT s.*, u.id as user_id, u.username, u.display_name, u.is_admin, u.created_at as user_created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(token) as any;

  if (!session) return null;

  return {
    id: session.id,
    token: session.token,
    user_id: session.user_id,
    expires_at: session.expires_at,
    created_at: session.created_at,
    user: {
      id: session.user_id,
      username: session.username,
      display_name: session.display_name,
      is_admin: session.is_admin,
      created_at: session.user_created_at
    }
  };
}

export function deleteSession(token: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  return result.changes > 0;
}

export function deleteExpiredSessions(): number {
  const db = getDatabase();
  const result = db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
  return result.changes;
}

// ============ Audit Log Functions ============

export function logAuditEntry(
  userId: number,
  action: 'create' | 'update' | 'delete',
  memberId: number,
  memberName: string | null,
  changes?: Record<string, { old: any; new: any }>
): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO audit_log (user_id, action, member_id, member_name, changes)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    userId,
    action,
    memberId,
    memberName,
    changes ? JSON.stringify(changes) : null
  );
}

export function getAuditLogForMember(memberId: number): AuditLogEntry[] {
  const db = getDatabase();
  return db.query(`
    SELECT a.*, u.display_name as user_display_name
    FROM audit_log a
    JOIN users u ON a.user_id = u.id
    WHERE a.member_id = ?
    ORDER BY a.timestamp DESC
  `).all(memberId) as AuditLogEntry[];
}

export function getAuditLog(limit: number = 50, offset: number = 0): AuditLogEntry[] {
  const db = getDatabase();
  return db.query(`
    SELECT a.*, u.display_name as user_display_name
    FROM audit_log a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.timestamp DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as AuditLogEntry[];
}

// Helper to compute changes between two member objects
export function computeChanges(
  oldMember: CoalitionMember,
  newData: Partial<CoalitionMember>
): Record<string, { old: any; new: any }> | null {
  const changes: Record<string, { old: any; new: any }> = {};
  const fields: (keyof CoalitionMember)[] = [
    'name', 'type', 'contact_name', 'contact_email', 'website',
    'notes', 'status', 'connected_via'
  ];

  for (const field of fields) {
    if (newData[field] !== undefined && newData[field] !== oldMember[field]) {
      changes[field] = { old: oldMember[field], new: newData[field] };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}
