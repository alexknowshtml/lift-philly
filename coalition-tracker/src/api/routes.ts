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
  getUserById,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  createSession,
  deleteSession,
  logAuditEntry,
  computeChanges,
  getAuditLogForMember,
  getAuditLog,
  createPetitionSigner,
  getApprovedPetitionSigners,
  getPendingPetitionSigners,
  getAllPetitionSigners,
  updatePetitionSignerStatus,
  getPetitionStats,
  type CoalitionMember,
  type UserRole
} from '../db/client';
import { getIndexHtml } from '../ui/index';
import { getLoginHtml } from '../ui/login';
import { getAdminHtml } from '../ui/admin';
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

// Create member (editor+)
app.post('/api/members', requireAuth, requireEditor, async (c) => {
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

// Update member (editor+)
app.put('/api/members/:id', requireAuth, requireEditor, async (c) => {
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

// Delete member (admin only)
app.delete('/api/members/:id', requireAuth, requireAdmin, (c) => {
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

// ============ Admin Routes (User Management) ============

// Admin page
app.get('/admin', requireAuth, requireAdmin, (c) => {
  const user = c.get('user');
  return c.html(getAdminHtml(user));
});

// Get all users
app.get('/api/users', requireAuth, requireAdmin, (c) => {
  const users = getAllUsers();
  return c.json(users);
});

// Create user
app.post('/api/users', requireAuth, requireAdmin, async (c) => {
  const body = await c.req.json<{ username: string; password: string; display_name: string; role: UserRole }>();

  if (!body.username || !body.password || !body.display_name) {
    return c.json({ error: 'Username, password, and display name required' }, 400);
  }

  // Check if username exists
  const existing = getUserByUsername(body.username);
  if (existing) {
    return c.json({ error: 'Username already exists' }, 400);
  }

  const passwordHash = await hashPassword(body.password);
  const user = createUser(body.username, passwordHash, body.display_name, body.role || 'viewer');

  return c.json({ id: user.id, username: user.username, display_name: user.display_name, role: user.role }, 201);
});

// Update user
app.put('/api/users/:id', requireAuth, requireAdmin, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json<{ display_name?: string; role?: UserRole; password?: string }>();

  const existing = getUserById(id);
  if (!existing) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Update password if provided
  if (body.password) {
    const passwordHash = await hashPassword(body.password);
    const { updateUserPassword } = require('../db/client');
    updateUserPassword(existing.username, passwordHash);
  }

  // Update other fields
  const updated = updateUser(id, { display_name: body.display_name, role: body.role });
  if (!updated) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ id: updated.id, username: updated.username, display_name: updated.display_name, role: updated.role });
});

// Delete user
app.delete('/api/users/:id', requireAuth, requireAdmin, (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const currentUser = c.get('user');

  // Can't delete yourself
  if (id === currentUser.id) {
    return c.json({ error: 'Cannot delete your own account' }, 400);
  }

  const deleted = deleteUser(id);
  if (!deleted) {
    return c.json({ error: 'Cannot delete user (may be the last admin)' }, 400);
  }

  return c.json({ success: true });
});

// ============ Petition Routes (public) ============

// Submit a signature
app.post('/api/petition', async (c) => {
  const body = await c.req.json<{ name: string; email: string; business_name?: string; business_url?: string }>();

  if (!body.name?.trim() || !body.email?.trim()) {
    return c.json({ error: 'Name and email are required' }, 400);
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return c.json({ error: 'Invalid email address' }, 400);
  }

  const signer = createPetitionSigner(
    body.name.trim(),
    body.email.trim().toLowerCase(),
    body.business_name?.trim() || null,
    body.business_url?.trim() || null
  );

  return c.json({ success: true, id: signer.id, name: signer.name, business_name: signer.business_name, business_url: signer.business_url }, 201);
});

// Get approved signers (public)
app.get('/api/petition/signers', (c) => {
  const signers = getApprovedPetitionSigners();
  return c.json(signers);
});

// ============ Petition Moderation Routes (admin only) ============

// Mod queue page
app.get('/petition/mod', requireAuth, requireAdmin, (c) => {
  const pending = getPendingPetitionSigners();
  const all = getAllPetitionSigners();
  const stats = getPetitionStats();

  const rows = (signers: typeof all, showActions: boolean) => signers.map(s => `
    <tr id="row-${s.id}">
      <td>${s.name}</td>
      <td>${s.business_name ? `<span>${s.business_name}</span>${s.business_url ? ` <a href="${s.business_url}" target="_blank" rel="noopener">↗</a>` : ''}` : '<span class="muted">—</span>'}</td>
      <td class="email">${s.email}</td>
      <td><span class="badge badge-${s.status}">${s.status}</span></td>
      <td class="date">${new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
      ${showActions ? `<td class="actions">
        ${s.status !== 'approved' ? `<button class="btn-approve" onclick="updateStatus(${s.id}, 'approved')">Approve</button>` : ''}
        ${s.status !== 'rejected' ? `<button class="btn-reject" onclick="updateStatus(${s.id}, 'rejected')">Reject</button>` : ''}
      </td>` : '<td></td>'}
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Petition Mod Queue — LIFT Philly</title>
  <style>
    :root { --navy: #0f172a; --gold: #fbbf24; --green: #16a34a; --red: #dc2626; --text: #334155; --border: #e2e8f0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; color: var(--text); background: #f8fafc; }
    header { background: var(--navy); color: white; padding: 16px 32px; display: flex; align-items: center; justify-content: space-between; }
    header h1 { font-size: 1.1rem; font-weight: 700; }
    header a { color: rgba(255,255,255,0.6); font-size: 0.85rem; text-decoration: none; }
    header a:hover { color: white; }
    .stats { display: flex; gap: 16px; padding: 20px 32px; background: white; border-bottom: 1px solid var(--border); }
    .stat { background: #f1f5f9; border-radius: 8px; padding: 12px 20px; min-width: 100px; text-align: center; }
    .stat .num { font-size: 1.6rem; font-weight: 800; color: var(--navy); line-height: 1; }
    .stat .label { font-size: 0.75rem; color: #64748b; margin-top: 4px; }
    .stat.pending .num { color: #d97706; }
    .stat.approved .num { color: var(--green); }
    main { padding: 24px 32px; }
    h2 { font-size: 1rem; font-weight: 700; color: var(--navy); margin-bottom: 12px; }
    .section { margin-bottom: 40px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.07); font-size: 0.875rem; }
    th { background: var(--navy); color: rgba(255,255,255,0.8); padding: 10px 14px; text-align: left; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8fafc; }
    .muted { color: #94a3b8; }
    .email { color: #64748b; font-size: 0.8rem; }
    .date { color: #94a3b8; font-size: 0.8rem; white-space: nowrap; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 100px; font-size: 0.75rem; font-weight: 600; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-approved { background: #dcfce7; color: #15803d; }
    .badge-rejected { background: #fee2e2; color: #991b1b; }
    .actions { display: flex; gap: 8px; }
    .btn-approve, .btn-reject { border: none; border-radius: 6px; padding: 4px 12px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
    .btn-approve { background: #dcfce7; color: #15803d; }
    .btn-approve:hover { background: #bbf7d0; }
    .btn-reject { background: #fee2e2; color: #991b1b; }
    .btn-reject:hover { background: #fecaca; }
    .empty { color: #94a3b8; font-style: italic; padding: 20px; text-align: center; }
    .toast { position: fixed; bottom: 24px; right: 24px; background: var(--navy); color: white; padding: 12px 20px; border-radius: 8px; font-size: 0.875rem; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
    .toast.show { opacity: 1; }
  </style>
</head>
<body>
  <header>
    <h1>LIFT Philly — Petition Mod Queue</h1>
    <a href="/">← Back to Coalition Tracker</a>
  </header>

  <div class="stats">
    <div class="stat"><div class="num">${stats.total}</div><div class="label">Total</div></div>
    <div class="stat pending"><div class="num">${stats.pending}</div><div class="label">Pending</div></div>
    <div class="stat approved"><div class="num">${stats.approved}</div><div class="label">Approved</div></div>
    <div class="stat"><div class="num">${stats.rejected}</div><div class="label">Rejected</div></div>
  </div>

  <main>
    <div class="section">
      <h2>Pending Review (${pending.length})</h2>
      ${pending.length === 0 ? '<p class="empty">No pending signatures.</p>' : `
      <table>
        <thead><tr><th>Name</th><th>Business</th><th>Email</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
        <tbody>${rows(pending, true)}</tbody>
      </table>`}
    </div>

    <div class="section">
      <h2>All Signatures</h2>
      <table>
        <thead><tr><th>Name</th><th>Business</th><th>Email</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
        <tbody>${rows(all, true)}</tbody>
      </table>
    </div>
  </main>

  <div class="toast" id="toast"></div>

  <script>
    async function updateStatus(id, status) {
      try {
        const res = await fetch('/api/petition/' + id + '/' + status, { method: 'POST' });
        if (!res.ok) throw new Error('Failed');
        showToast(status === 'approved' ? 'Approved!' : 'Rejected');
        const row = document.getElementById('row-' + id);
        if (row) {
          const badge = row.querySelector('.badge');
          badge.className = 'badge badge-' + status;
          badge.textContent = status;
          const actions = row.querySelector('.actions');
          actions.innerHTML = status !== 'rejected'
            ? '<button class="btn-reject" onclick="updateStatus(' + id + ', \'rejected\')">Reject</button>'
            : '<button class="btn-approve" onclick="updateStatus(' + id + ', \'approved\')">Approve</button>';
        }
      } catch (e) {
        showToast('Error updating status', true);
      }
    }

    function showToast(msg, isError) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.style.background = isError ? '#dc2626' : '#0f172a';
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2500);
    }
  </script>
</body>
</html>`;

  return c.html(html);
});

// Approve signer (admin)
app.post('/api/petition/:id/approved', requireAuth, requireAdmin, (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const ok = updatePetitionSignerStatus(id, 'approved');
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ success: true });
});

// Reject signer (admin)
app.post('/api/petition/:id/rejected', requireAuth, requireAdmin, (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const ok = updatePetitionSignerStatus(id, 'rejected');
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ success: true });
});

// ============ UI Routes ============

// Serve UI (protected)
app.get('/', requireAuth, (c) => {
  const user = c.get('user');
  // Pass users list for "last contacted by" dropdown (editors/admins only)
  const users = (user?.role === 'editor' || user?.role === 'admin') ? getAllUsers() : [];
  return c.html(getIndexHtml(user, users));
});

export default app;
