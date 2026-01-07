import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getStats,
  type CoalitionMember
} from '../db/client';
import { getIndexHtml } from '../ui/index';

const app = new Hono();

// Enable CORS
app.use('*', cors());

// Health check
app.get('/health', (c) => c.json({ status: 'ok', service: 'coalition-tracker' }));

// Stats
app.get('/api/stats', (c) => {
  const stats = getStats();
  return c.json(stats);
});

// Get all members
app.get('/api/members', (c) => {
  const status = c.req.query('status');
  let members = getAllMembers();
  if (status) {
    members = members.filter(m => m.status === status);
  }
  return c.json(members);
});

// Get single member
app.get('/api/members/:id', (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const member = getMemberById(id);
  if (!member) {
    return c.json({ error: 'Member not found' }, 404);
  }
  return c.json(member);
});

// Create member
app.post('/api/members', async (c) => {
  const body = await c.req.json<Partial<CoalitionMember>>();
  if (!body.name) {
    return c.json({ error: 'Name is required' }, 400);
  }
  const member = createMember(body);
  return c.json(member, 201);
});

// Update member
app.put('/api/members/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json<Partial<CoalitionMember>>();
  const member = updateMember(id, body);
  if (!member) {
    return c.json({ error: 'Member not found' }, 404);
  }
  return c.json(member);
});

// Delete member
app.delete('/api/members/:id', (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const deleted = deleteMember(id);
  if (!deleted) {
    return c.json({ error: 'Member not found' }, 404);
  }
  return c.json({ success: true });
});

// Serve UI
app.get('/', (c) => {
  return c.html(getIndexHtml());
});

export default app;
