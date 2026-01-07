import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getStats,
  getUserByUsername,
  createSession,
  deleteSession,
  logAuditEntry,
  computeChanges,
  getAuditLogForMember,
  getAuditLog,
  getUserById,
  type CoalitionMember
} from '../db/client';
import { getIndexHtml } from '../ui/index';
import { getLoginHtml } from '../ui/login';
import { requireAuth } from '../auth/middleware';
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
app.get('/login', (c) => {
  // If already logged in, redirect to home
  const cookieHeader = c.req.header('Cookie');
  const token = getSessionCookie(cookieHeader);
  if (token) {
    const { getSessionByToken } = require('../db/client');
    const session = getSessionByToken(token);
    if (session) {
      return c.redirect('/');
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

  const user = getUserByUsername(body.username);
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const validPassword = await verifyPassword(body.password, user.password_hash);
  if (!validPassword) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = createSession(user.id);
  const cookie = createSessionCookie(token);

  return c.json(
    { success: true, user: { id: user.id, username: user.username, display_name: user.display_name } },
    200,
    { 'Set-Cookie': cookie }
  );
});

// Logout API
app.post('/api/logout', (c) => {
  const cookieHeader = c.req.header('Cookie');
  const token = getSessionCookie(cookieHeader);

  if (token) {
    deleteSession(token);
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
app.get('/api/stats', requireAuth, (c) => {
  const stats = getStats();
  return c.json(stats);
});

// Get all members
app.get('/api/members', requireAuth, (c) => {
  const status = c.req.query('status');
  let members = getAllMembers();
  if (status) {
    members = members.filter(m => m.status === status);
  }
  return c.json(members);
});

// Get single member
app.get('/api/members/:id', requireAuth, (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const member = getMemberById(id);
  if (!member) {
    return c.json({ error: 'Member not found' }, 404);
  }
  return c.json(member);
});

// Create member
app.post('/api/members', requireAuth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<Partial<CoalitionMember>>();

  if (!body.name) {
    return c.json({ error: 'Name is required' }, 400);
  }

  const member = createMember(body, userId);

  // Log the creation
  logAuditEntry(userId, 'create', member.id, member.name);

  return c.json(member, 201);
});

// Update member
app.put('/api/members/:id', requireAuth, async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json<Partial<CoalitionMember>>();

  const existing = getMemberById(id);
  if (!existing) {
    return c.json({ error: 'Member not found' }, 404);
  }

  // Compute what changed
  const changes = computeChanges(existing, body);

  const member = updateMember(id, body, userId);
  if (!member) {
    return c.json({ error: 'Member not found' }, 404);
  }

  // Log the update with changes
  if (changes) {
    logAuditEntry(userId, 'update', member.id, member.name, changes);
  }

  return c.json(member);
});

// Delete member
app.delete('/api/members/:id', requireAuth, (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'), 10);

  const existing = getMemberById(id);
  if (!existing) {
    return c.json({ error: 'Member not found' }, 404);
  }

  const deleted = deleteMember(id);
  if (!deleted) {
    return c.json({ error: 'Member not found' }, 404);
  }

  // Log the deletion
  logAuditEntry(userId, 'delete', id, existing.name);

  return c.json({ success: true });
});

// ============ Audit Log Routes ============

// Get audit log for a specific member
app.get('/api/members/:id/history', requireAuth, (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const history = getAuditLogForMember(id);
  return c.json(history);
});

// Get full audit log
app.get('/api/audit-log', requireAuth, (c) => {
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);
  const log = getAuditLog(limit, offset);
  return c.json(log);
});

// ============ UI Routes ============

// Serve UI (protected)
app.get('/', requireAuth, (c) => {
  const user = c.get('user');
  return c.html(getIndexHtml(user));
});

export default app;
