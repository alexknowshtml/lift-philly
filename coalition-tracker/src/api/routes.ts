import { Hono } from 'hono';

async function addSubscriberToKit(email: string, name: string): Promise<void> {
  const key = process.env.KIT_API_KEY;
  if (!key) return;
  await fetch('https://api.kit.com/v4/subscribers', {
    method: 'POST',
    headers: { 'X-Kit-Api-Key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_address: email, first_name: name }),
  });
}

async function removeSubscriberFromKit(email: string): Promise<void> {
  const key = process.env.KIT_API_KEY;
  if (!key) return;
  const res = await fetch(
    `https://api.kit.com/v4/subscribers?email_address=${encodeURIComponent(email)}`,
    { headers: { 'X-Kit-Api-Key': key, 'Accept': 'application/json' } }
  );
  const data = await res.json() as { subscribers?: { id: number }[] };
  const sub = data.subscribers?.[0];
  if (!sub) return;
  await fetch(`https://api.kit.com/v4/subscribers/${sub.id}`, {
    method: 'DELETE',
    headers: { 'X-Kit-Api-Key': key },
  });
}

async function syncCoalitionMemberToKit(member: { contact_email: string | null; name: string; status: string }): Promise<void> {
  if (!member.contact_email) return;
  if (member.status === 'active') {
    await addSubscriberToKit(member.contact_email, member.name);
  } else {
    await removeSubscriberFromKit(member.contact_email);
  }
}

// Simple in-memory cache for public petition endpoints
const petitionCache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_MS = 15_000; // 15 seconds — fast enough for post-approval freshness

// Rate limiter: max 5 submissions per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function getCached<T>(key: string): T | null {
  const entry = petitionCache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data as T;
  petitionCache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  petitionCache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

export function invalidatePetitionCache(): void {
  petitionCache.clear();
}
import { cors } from 'hono/cors';
import {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getStats,
  getUserByUsername,
  getUserById,
  getAllUsers,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  createSession,
  getSessionByToken,
  deleteSession,
  logAuditEntry,
  computeChanges,
  getAuditLogForMember,
  getAuditLog,
  createPetitionSigner,
  getPetitionSignerByEmail,
  getPetitionSignerById,
  getApprovedPetitionSigners,
  getPendingPetitionSigners,
  getAllPetitionSigners,
  getRejectedPetitionSigners,
  updatePetitionSignerStatus,
  deletePetitionSigner,
  getPetitionStats,
  getPublicPetitionStats,
  getPetitionAdminStats,
  type CoalitionMember,
  type UserRole
} from '../db/client';
import { getIndexHtml } from '../ui/index';
import { getLoginHtml } from '../ui/login';
import { getAdminHtml } from '../ui/admin';
import { getPetitionModHtml } from '../ui/petition-mod';
import { requireAuth, requireEditor, requireAdmin } from '../auth/middleware';
import { hashPassword, verifyPassword, getSessionCookie, createSessionCookie, createLogoutCookie } from '../auth/utils';

const app = new Hono();

// Enable CORS
app.use('*', cors());

// Health check (no auth)
app.get('/health', (c) => c.json({ status: 'ok', service: 'coalition-tracker' }));

// Favicon
app.get('/favicon.svg', (c) => {
  const svg = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="6" fill="#0f172a"/>
  <text x="8" y="24" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="800" fill="#fbbf24">L</text>
</svg>`;
  return c.body(svg, 200, { 'Content-Type': 'image/svg+xml' });
});

// ============ Auth Routes ============

// Login page
app.get('/login', async (c) => {
  // If already logged in, redirect to home
  const cookieHeader = c.req.header('Cookie');
  const token = getSessionCookie(cookieHeader);
  if (token) {
    const session = await getSessionByToken(token);
    if (session) {
      return c.redirect('/admin');
    }
  }
  return c.html(getLoginHtml());
});

// Login API
app.post('/api/login', async (c) => {
  const body = await c.req.json<{ username: string; password: string }>();

  if (!body.username || !body.password) {
    return c.json({ error: 'Username and password required' }, 400);
  }

  const user = await getUserByUsername(body.username);
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const validPassword = await verifyPassword(body.password, user.password_hash);
  if (!validPassword) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = await createSession(user.id);
  const cookie = createSessionCookie(token);

  return c.json(
    { success: true, user: { id: user.id, username: user.username, display_name: user.display_name } },
    200,
    { 'Set-Cookie': cookie }
  );
});

// Logout API
app.post('/api/logout', async (c) => {
  const cookieHeader = c.req.header('Cookie');
  const token = getSessionCookie(cookieHeader);

  if (token) {
    await deleteSession(token);
  }

  return c.json({ success: true }, 200, { 'Set-Cookie': createLogoutCookie() });
});

// Get current user
app.get('/api/me', requireAuth, (c) => {
  const user = c.get('user');
  return c.json(user);
});

// ============ Protected API Routes ============

// Stats
app.get('/api/stats', requireAuth, async (c) => {
  const stats = await getStats();
  return c.json(stats);
});

// Get all members
app.get('/api/members', requireAuth, async (c) => {
  const status = c.req.query('status');
  let members = await getAllMembers();
  if (status) {
    members = members.filter(m => m.status === status);
  }
  return c.json(members);
});

// Get single member
app.get('/api/members/:id', requireAuth, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const member = await getMemberById(id);
  if (!member) {
    return c.json({ error: 'Member not found' }, 404);
  }
  return c.json(member);
});

// Create member (editor+)
app.post('/api/members', requireAuth, requireEditor, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<Partial<CoalitionMember>>();

  if (!body.name) {
    return c.json({ error: 'Name is required' }, 400);
  }

  const member = await createMember(body, userId);

  // Log the creation
  await logAuditEntry(userId, 'create', member.id, member.name);

  return c.json(member, 201);
});

// Update member (editor+)
app.put('/api/members/:id', requireAuth, requireEditor, async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json<Partial<CoalitionMember>>();

  const existing = await getMemberById(id);
  if (!existing) {
    return c.json({ error: 'Member not found' }, 404);
  }

  // Compute what changed
  const changes = computeChanges(existing, body);

  const member = await updateMember(id, body, userId);
  if (!member) {
    return c.json({ error: 'Member not found' }, 404);
  }

  // Log the update with changes
  if (changes) {
    await logAuditEntry(userId, 'update', member.id, member.name, changes);
  }

  syncCoalitionMemberToKit(member).catch(() => {});

  return c.json(member);
});

// Delete member (admin only)
app.delete('/api/members/:id', requireAuth, requireAdmin, async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'), 10);

  const existing = await getMemberById(id);
  if (!existing) {
    return c.json({ error: 'Member not found' }, 404);
  }

  const deleted = await deleteMember(id);
  if (!deleted) {
    return c.json({ error: 'Member not found' }, 404);
  }

  // Log the deletion
  await logAuditEntry(userId, 'delete', id, existing.name);

  return c.json({ success: true });
});

// ============ Audit Log Routes ============

// Get audit log for a specific member
app.get('/api/members/:id/history', requireAuth, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const history = await getAuditLogForMember(id);
  return c.json(history);
});

// Get full audit log
app.get('/api/audit-log', requireAuth, async (c) => {
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);
  const log = await getAuditLog(limit, offset);
  return c.json(log);
});

// ============ Admin Routes (User Management) ============

// Admin users page
app.get('/admin/users', requireAuth, requireAdmin, (c) => {
  const user = c.get('user');
  return c.html(getAdminHtml(user));
});

// Get all users
app.get('/api/users', requireAuth, requireAdmin, async (c) => {
  const users = await getAllUsers();
  return c.json(users);
});

// Create user
app.post('/api/users', requireAuth, requireAdmin, async (c) => {
  const body = await c.req.json<{ username: string; password: string; display_name: string; role: UserRole }>();

  if (!body.username || !body.password || !body.display_name) {
    return c.json({ error: 'Username, password, and display name required' }, 400);
  }

  // Check if username exists
  const existing = await getUserByUsername(body.username);
  if (existing) {
    return c.json({ error: 'Username already exists' }, 400);
  }

  const passwordHash = await hashPassword(body.password);
  const user = await createUser(body.username, passwordHash, body.display_name, body.role || 'viewer');

  return c.json({ id: user.id, username: user.username, display_name: user.display_name, role: user.role }, 201);
});

// Update user
app.put('/api/users/:id', requireAuth, requireAdmin, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json<{ display_name?: string; role?: UserRole; password?: string }>();

  const existing = await getUserById(id);
  if (!existing) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Update password if provided
  if (body.password) {
    const passwordHash = await hashPassword(body.password);
    await updateUserPassword(existing.username, passwordHash);
  }

  // Update other fields
  const updated = await updateUser(id, { display_name: body.display_name, role: body.role });
  if (!updated) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ id: updated.id, username: updated.username, display_name: updated.display_name, role: updated.role });
});

// Delete user
app.delete('/api/users/:id', requireAuth, requireAdmin, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const currentUser = c.get('user');

  // Can't delete yourself
  if (id === currentUser.id) {
    return c.json({ error: 'Cannot delete your own account' }, 400);
  }

  const deleted = await deleteUser(id);
  if (!deleted) {
    return c.json({ error: 'Cannot delete user (may be the last admin)' }, 400);
  }

  return c.json({ success: true });
});

// ============ Petition Routes (public) ============

// Submit a signature
app.post('/api/petition', async (c) => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown';

  const body = await c.req.json<{ name: string; email: string; zip_code: string; signer_type?: string; business_name?: string; business_url?: string; industry?: string; comment?: string; anonymous?: boolean }>();

  // Validate required fields before consuming a rate limit slot
  if (!body.name?.trim() || !body.email?.trim() || !body.zip_code?.trim()) {
    return c.json({ error: 'Name, email, and zip code are required' }, 400);
  }

  // Field length caps (mirrors HTML maxlength attributes)
  if (body.name.trim().length > 100) return c.json({ error: 'Name must be 100 characters or fewer' }, 400);
  if (body.email.trim().length > 254) return c.json({ error: 'Email must be 254 characters or fewer' }, 400);
  if (body.business_name && body.business_name.trim().length > 150) return c.json({ error: 'Business name must be 150 characters or fewer' }, 400);
  if (body.business_url && body.business_url.trim().length > 500) return c.json({ error: 'Business URL must be 500 characters or fewer' }, 400);
  if (body.industry && body.industry.trim().length > 100) return c.json({ error: 'Industry must be 100 characters or fewer' }, 400);
  if (body.comment && body.comment.trim().length > 1000) return c.json({ error: 'Comment must be 1000 characters or fewer' }, 400);

  // Validate zip code (5 digits)
  if (!/^\d{5}$/.test(body.zip_code.trim())) {
    return c.json({ error: 'Please enter a valid 5-digit zip code' }, 400);
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return c.json({ error: 'Invalid email address' }, 400);
  }

  // Validate business_url format if provided
  const rawUrl = body.business_url?.trim();
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return c.json({ error: 'Business URL must start with http:// or https://' }, 400);
      }
    } catch {
      return c.json({ error: 'Please enter a valid business URL' }, 400);
    }
  }

  // Validate signer_type if provided — reject unknown values rather than silently nulling
  const validSignerTypes = ['business_owner', 'employee', 'concerned_citizen'];
  if (body.signer_type && !validSignerTypes.includes(body.signer_type)) {
    return c.json({ error: 'Invalid signer type. Must be business_owner, employee, or concerned_citizen.' }, 400);
  }
  const signerType = body.signer_type || null;

  // Rate limit by IP — only counts after all validation passes
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Too many submissions. Please try again later.' }, 429);
  }

  // Deduplicate by email
  const email = body.email.trim().toLowerCase();
  const existing = await getPetitionSignerByEmail(email);
  if (existing) {
    return c.json({ error: 'This email has already signed the petition.' }, 409);
  }

  const signer = await createPetitionSigner(
    body.name.trim(),
    email,
    body.zip_code.trim(),
    signerType,
    body.business_name?.trim() || null,
    rawUrl || null,
    body.industry?.trim() || null,
    body.comment?.trim() || null,
    !!body.anonymous
  );

  invalidatePetitionCache();
  return c.json({ success: true, id: signer.id, name: signer.name, business_name: signer.business_name, business_url: signer.business_url, anonymous: signer.anonymous }, 201);
});

// Get approved signers (public) — cached 60s
app.get('/api/petition/signers', async (c) => {
  type SignerList = Awaited<ReturnType<typeof getApprovedPetitionSigners>>;
  const cached = getCached<SignerList>('signers');
  if (cached) return c.json(cached);
  const signers = await getApprovedPetitionSigners();
  setCache('signers', signers);
  return c.json(signers);
});

// Get public petition stats — cached 60s
app.get('/api/petition/stats', async (c) => {
  type PetitionStats = Awaited<ReturnType<typeof getPublicPetitionStats>>;
  const cached = getCached<PetitionStats>('stats');
  if (cached) return c.json(cached);
  const stats = await getPublicPetitionStats();
  setCache('stats', stats);
  return c.json(stats);
});

// ============ Petition Moderation Routes (admin only) ============

// Mod queue page
app.get('/admin/petition', requireAuth, requireAdmin, async (c) => {
  const user = c.get('user');
  const [pending, rejected, all, stats] = await Promise.all([
    getPendingPetitionSigners(),
    getRejectedPetitionSigners(),
    getAllPetitionSigners(),
    getPetitionStats(),
  ]);
  return c.html(getPetitionModHtml(user, pending, rejected, all, stats));
});

// Admin stats (admin)
app.get('/api/petition/admin-stats', requireAuth, requireAdmin, async (c) => {
  const stats = await getPetitionAdminStats();
  return c.json(stats);
});

// District GeoJSON proxy — fetches from ArcGIS server-side (no browser CORS), cached 24h
let _districtCache: { data: unknown; ts: number } | null = null;
app.get('/api/petition/district-geojson', requireAuth, requireAdmin, async (c) => {
  const now = Date.now();
  if (_districtCache && now - _districtCache.ts < 86400_000) return c.json(_districtCache.data);
  // Follow redirect from opendata.arcgis.com → hub.arcgis.com
  const res = await fetch('https://opendata.arcgis.com/datasets/9298c2f3fa3241fbb176ff1e84d33360_0.geojson', { redirect: 'follow' });
  if (!res.ok) return c.json({ error: 'upstream failed', status: res.status }, 502);
  const data = await res.json();
  _districtCache = { data, ts: now };
  return c.json(data);
});

// Approve signer (admin)
app.post('/api/petition/:id/approved', requireAuth, requireAdmin, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const signer = await getPetitionSignerById(id);
  if (!signer) return c.json({ error: 'Not found' }, 404);
  const ok = await updatePetitionSignerStatus(id, 'approved');
  if (!ok) return c.json({ error: 'Not found' }, 404);
  invalidatePetitionCache();
  addSubscriberToKit(signer.email, signer.name).catch(() => {});
  return c.json({ success: true });
});

// Reject signer (admin)
app.post('/api/petition/:id/rejected', requireAuth, requireAdmin, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const signer = await getPetitionSignerById(id);
  if (!signer) return c.json({ error: 'Not found' }, 404);
  const ok = await updatePetitionSignerStatus(id, 'rejected');
  if (!ok) return c.json({ error: 'Not found' }, 404);
  invalidatePetitionCache();
  removeSubscriberFromKit(signer.email).catch(() => {});
  return c.json({ success: true });
});

// Reset signer to pending (admin)
app.post('/api/petition/:id/pending', requireAuth, requireAdmin, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const ok = await updatePetitionSignerStatus(id, 'pending');
  if (!ok) return c.json({ error: 'Not found' }, 404);
  invalidatePetitionCache();
  return c.json({ success: true });
});

// Delete signer (admin) — permanent removal, use for test/spam entries
app.delete('/api/petition/:id', requireAuth, requireAdmin, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const ok = await deletePetitionSigner(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  invalidatePetitionCache();
  return c.json({ success: true });
});

// ============ UI Routes ============

// Serve UI (protected)
app.get('/admin', requireAuth, async (c) => {
  const user = c.get('user');
  // Pass users list for "last contacted by" dropdown (editors/admins only)
  const users = (user?.role === 'editor' || user?.role === 'admin') ? await getAllUsers() : [];
  return c.html(getIndexHtml(user, users));
});

export default app;
