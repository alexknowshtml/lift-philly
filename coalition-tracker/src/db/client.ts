import { createClient, type Client, type Row } from '@libsql/client';

const client: Client = createClient({
  url: process.env.TURSO_URL || 'file:/data/liftphilly.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export { client };

// ============ Type Helpers ============

function rowToObj<T>(row: Row | undefined): T | null {
  if (!row) return null;
  return Object.fromEntries(Object.entries(row)) as unknown as T;
}

function rowsToObj<T>(rows: readonly Row[]): T[] {
  return rows.map(row => Object.fromEntries(Object.entries(row)) as unknown as T);
}

// ============ Interfaces ============

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
  connected_via_id: number | null;
  connected_via_notes: string | null;
  last_contact: string | null;
  last_contacted_by: number | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  // Joined fields for display
  connected_via_name?: string | null;
  last_contacted_by_name?: string | null;
}

export type UserRole = 'viewer' | 'editor' | 'admin';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  is_admin: number;
  role: UserRole;
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

export interface PetitionSigner {
  id: number;
  name: string;
  email: string;
  zip_code: string;
  business_name: string | null;
  business_url: string | null;
  industry: string | null;
  comment: string | null;
  anonymous: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// ============ Coalition Functions ============

export async function getAllMembers(): Promise<CoalitionMember[]> {
  const rs = await client.execute(`
    SELECT c.*,
           cv.contact_name as connected_via_name,
           u.display_name as last_contacted_by_name
    FROM coalition c
    LEFT JOIN coalition cv ON c.connected_via_id = cv.id
    LEFT JOIN users u ON c.last_contacted_by = u.id
    ORDER BY c.status, c.name
  `);
  return rowsToObj<CoalitionMember>(rs.rows);
}

export async function getMemberById(id: number): Promise<CoalitionMember | null> {
  const rs = await client.execute({ sql: 'SELECT * FROM coalition WHERE id = ?', args: [id] });
  return rowToObj<CoalitionMember>(rs.rows[0]);
}

export async function createMember(member: Partial<CoalitionMember>, userId?: number): Promise<CoalitionMember> {
  const rs = await client.execute({
    sql: `INSERT INTO coalition (name, type, contact_name, contact_email, website, notes, public_display, status, connected_via_id, connected_via_notes, last_contact, last_contacted_by, created_by, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      member.name || '',
      member.type || null,
      member.contact_name || null,
      member.contact_email || null,
      member.website || null,
      member.notes || null,
      member.public_display || 0,
      member.status || 'prospect',
      member.connected_via_id || null,
      member.connected_via_notes || null,
      member.last_contact || null,
      member.last_contacted_by || null,
      userId || null,
      userId || null,
    ],
  });
  return (await getMemberById(Number(rs.lastInsertRowid)))!;
}

export async function updateMember(id: number, member: Partial<CoalitionMember>, userId?: number): Promise<CoalitionMember | null> {
  const existing = await getMemberById(id);
  if (!existing) return null;

  await client.execute({
    sql: `UPDATE coalition SET
      name = ?, type = ?, contact_name = ?, contact_email = ?, website = ?, notes = ?,
      public_display = ?, status = ?, connected_via_id = ?, connected_via_notes = ?,
      last_contact = ?, last_contacted_by = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    args: [
      member.name ?? existing.name,
      member.type ?? existing.type,
      member.contact_name ?? existing.contact_name,
      member.contact_email ?? existing.contact_email,
      member.website ?? existing.website,
      member.notes ?? existing.notes,
      member.public_display ?? existing.public_display,
      member.status ?? existing.status,
      member.connected_via_id !== undefined ? member.connected_via_id : existing.connected_via_id,
      member.connected_via_notes !== undefined ? member.connected_via_notes : existing.connected_via_notes,
      member.last_contact !== undefined ? member.last_contact : existing.last_contact,
      member.last_contacted_by !== undefined ? member.last_contacted_by : existing.last_contacted_by,
      userId || null,
      id,
    ],
  });
  return getMemberById(id);
}

export async function deleteMember(id: number): Promise<boolean> {
  const rs = await client.execute({ sql: 'DELETE FROM coalition WHERE id = ?', args: [id] });
  return rs.rowsAffected > 0;
}

export async function getStats(): Promise<{ total: number; active: number; prospect: number; contacted: number; inactive: number }> {
  const rs = await client.execute(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'prospect' THEN 1 ELSE 0 END) as prospect,
      SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
      SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
    FROM coalition
  `);
  const row = rs.rows[0];
  return {
    total: Number(row.total),
    active: Number(row.active),
    prospect: Number(row.prospect),
    contacted: Number(row.contacted),
    inactive: Number(row.inactive),
  };
}

// ============ User Functions ============

export async function getUserByUsername(username: string): Promise<User | null> {
  const rs = await client.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [username] });
  return rowToObj<User>(rs.rows[0]);
}

export async function getUserById(id: number): Promise<User | null> {
  const rs = await client.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
  return rowToObj<User>(rs.rows[0]);
}

export async function createUser(username: string, passwordHash: string, displayName: string, role: UserRole = 'viewer'): Promise<User> {
  const isAdmin = role === 'admin' ? 1 : 0;
  const rs = await client.execute({
    sql: 'INSERT INTO users (username, password_hash, display_name, is_admin, role) VALUES (?, ?, ?, ?, ?)',
    args: [username, passwordHash, displayName, isAdmin, role],
  });
  return (await getUserById(Number(rs.lastInsertRowid)))!;
}

export async function getAllUsers(): Promise<Omit<User, 'password_hash'>[]> {
  const rs = await client.execute('SELECT id, username, display_name, is_admin, role, created_at FROM users ORDER BY display_name');
  return rowsToObj<Omit<User, 'password_hash'>>(rs.rows);
}

export async function deleteUser(id: number): Promise<boolean> {
  const adminRs = await client.execute("SELECT COUNT(*) as count FROM users WHERE is_admin = 1");
  const adminCount = Number(adminRs.rows[0].count);
  const user = await getUserById(id);
  if (user?.is_admin && adminCount <= 1) return false;
  const rs = await client.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
  return rs.rowsAffected > 0;
}

export async function updateUserPassword(username: string, newPasswordHash: string): Promise<boolean> {
  const rs = await client.execute({ sql: 'UPDATE users SET password_hash = ? WHERE username = ?', args: [newPasswordHash, username] });
  return rs.rowsAffected > 0;
}

export async function updateUser(id: number, updates: { display_name?: string; role?: UserRole }): Promise<User | null> {
  const user = await getUserById(id);
  if (!user) return null;
  const newDisplayName = updates.display_name ?? user.display_name;
  const newRole = updates.role ?? user.role;
  const newIsAdmin = newRole === 'admin' ? 1 : 0;
  await client.execute({
    sql: 'UPDATE users SET display_name = ?, role = ?, is_admin = ? WHERE id = ?',
    args: [newDisplayName, newRole, newIsAdmin, id],
  });
  return getUserById(id);
}

// ============ Session Functions ============

const SESSION_DURATION_DAYS = 7;

export async function createSession(userId: number): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await client.execute({
    sql: 'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
    args: [token, userId, expiresAt],
  });
  return token;
}

export async function getSessionByToken(token: string): Promise<(Session & { user: Omit<User, 'password_hash'> }) | null> {
  const rs = await client.execute({
    sql: `SELECT s.*, u.id as uid, u.username, u.display_name, u.is_admin, u.role, u.created_at as user_created_at
          FROM sessions s
          JOIN users u ON s.user_id = u.id
          WHERE s.token = ? AND s.expires_at > datetime('now')`,
    args: [token],
  });
  const session = rs.rows[0];
  if (!session) return null;
  return {
    id: Number(session.id),
    token: session.token as string,
    user_id: Number(session.user_id),
    expires_at: session.expires_at as string,
    created_at: session.created_at as string,
    user: {
      id: Number(session.uid),
      username: session.username as string,
      display_name: session.display_name as string,
      is_admin: Number(session.is_admin),
      role: (session.role || 'viewer') as UserRole,
      created_at: session.user_created_at as string,
    },
  };
}

export async function deleteSession(token: string): Promise<boolean> {
  const rs = await client.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] });
  return rs.rowsAffected > 0;
}

export async function deleteExpiredSessions(): Promise<number> {
  const rs = await client.execute("DELETE FROM sessions WHERE expires_at <= datetime('now')");
  return rs.rowsAffected;
}

// ============ Audit Log Functions ============

export async function logAuditEntry(
  userId: number,
  action: 'create' | 'update' | 'delete',
  memberId: number,
  memberName: string | null,
  changes?: Record<string, { old: any; new: any }>
): Promise<void> {
  await client.execute({
    sql: 'INSERT INTO audit_log (user_id, action, member_id, member_name, changes) VALUES (?, ?, ?, ?, ?)',
    args: [userId, action, memberId, memberName, changes ? JSON.stringify(changes) : null],
  });
}

export async function getAuditLogForMember(memberId: number): Promise<AuditLogEntry[]> {
  const rs = await client.execute({
    sql: `SELECT a.*, u.display_name as user_display_name
          FROM audit_log a JOIN users u ON a.user_id = u.id
          WHERE a.member_id = ? ORDER BY a.timestamp DESC`,
    args: [memberId],
  });
  return rowsToObj<AuditLogEntry>(rs.rows);
}

export async function getAuditLog(limit: number = 50, offset: number = 0): Promise<AuditLogEntry[]> {
  const rs = await client.execute({
    sql: `SELECT a.*, u.display_name as user_display_name
          FROM audit_log a JOIN users u ON a.user_id = u.id
          ORDER BY a.timestamp DESC LIMIT ? OFFSET ?`,
    args: [limit, offset],
  });
  return rowsToObj<AuditLogEntry>(rs.rows);
}

// ============ Petition Functions ============

export async function createPetitionSigner(
  name: string,
  email: string,
  zip_code: string,
  business_name: string | null,
  business_url: string | null,
  industry: string | null,
  comment: string | null,
  anonymous: boolean = false
): Promise<PetitionSigner> {
  const rs = await client.execute({
    sql: 'INSERT INTO petition_signers (name, email, zip_code, business_name, business_url, industry, comment, anonymous) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [name, email, zip_code, business_name || null, business_url || null, industry || null, comment || null, anonymous ? 1 : 0],
  });
  const row = await client.execute({ sql: 'SELECT * FROM petition_signers WHERE id = ?', args: [rs.lastInsertRowid] });
  return rowToObj<PetitionSigner>(row.rows[0])!;
}

export async function getApprovedPetitionSigners(): Promise<Omit<PetitionSigner, 'email' | 'status'>[]> {
  const rs = await client.execute(`
    SELECT id, name, business_name, business_url, industry, anonymous, created_at
    FROM petition_signers WHERE status = 'approved' ORDER BY created_at ASC
  `);
  return rowsToObj<Omit<PetitionSigner, 'email' | 'status'>>(rs.rows);
}

export async function getPendingPetitionSigners(): Promise<PetitionSigner[]> {
  const rs = await client.execute("SELECT * FROM petition_signers WHERE status = 'pending' ORDER BY created_at ASC");
  return rowsToObj<PetitionSigner>(rs.rows);
}

export async function getAllPetitionSigners(): Promise<PetitionSigner[]> {
  const rs = await client.execute('SELECT * FROM petition_signers ORDER BY created_at DESC');
  return rowsToObj<PetitionSigner>(rs.rows);
}

export async function updatePetitionSignerStatus(id: number, status: 'approved' | 'rejected'): Promise<boolean> {
  const rs = await client.execute({ sql: 'UPDATE petition_signers SET status = ? WHERE id = ?', args: [status, id] });
  return rs.rowsAffected > 0;
}

export async function getPetitionStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
  const rs = await client.execute(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM petition_signers
  `);
  const row = rs.rows[0];
  return {
    total: Number(row.total),
    pending: Number(row.pending),
    approved: Number(row.approved),
    rejected: Number(row.rejected),
  };
}

export async function getPublicPetitionStats(): Promise<{ approved: number; recent: number }> {
  const rs = await client.execute(`
    SELECT
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'approved' AND created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as recent
    FROM petition_signers
  `);
  const row = rs.rows[0];
  return { approved: Number(row.approved), recent: Number(row.recent) };
}

// ============ Helper ============

export function computeChanges(
  oldMember: CoalitionMember,
  newData: Partial<CoalitionMember>
): Record<string, { old: any; new: any }> | null {
  const changes: Record<string, { old: any; new: any }> = {};
  const fields: (keyof CoalitionMember)[] = [
    'name', 'type', 'contact_name', 'contact_email', 'website',
    'notes', 'status', 'connected_via_id', 'connected_via_notes',
    'last_contact', 'last_contacted_by',
  ];
  for (const field of fields) {
    if (newData[field] !== undefined && newData[field] !== oldMember[field]) {
      changes[field] = { old: oldMember[field], new: newData[field] };
    }
  }
  return Object.keys(changes).length > 0 ? changes : null;
}
