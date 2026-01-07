import { Context, Next } from 'hono';
import { getSessionByToken, User } from '../db/client';
import { getSessionCookie } from './utils';

// Extend Hono's context to include user
declare module 'hono' {
  interface ContextVariableMap {
    user: Omit<User, 'password_hash'>;
    userId: number;
  }
}

// Middleware to require authentication
export async function requireAuth(c: Context, next: Next) {
  const cookieHeader = c.req.header('Cookie');
  const token = getSessionCookie(cookieHeader);

  if (!token) {
    // For API requests, return 401
    if (c.req.path.startsWith('/api/')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    // For page requests, redirect to login
    return c.redirect('/login');
  }

  const session = getSessionByToken(token);
  if (!session) {
    if (c.req.path.startsWith('/api/')) {
      return c.json({ error: 'Session expired' }, 401);
    }
    return c.redirect('/login');
  }

  // Set user in context
  c.set('user', session.user);
  c.set('userId', session.user.id);

  await next();
}

// Middleware to optionally get user (for routes that work with or without auth)
export async function optionalAuth(c: Context, next: Next) {
  const cookieHeader = c.req.header('Cookie');
  const token = getSessionCookie(cookieHeader);

  if (token) {
    const session = getSessionByToken(token);
    if (session) {
      c.set('user', session.user);
      c.set('userId', session.user.id);
    }
  }

  await next();
}

// Middleware to require admin privileges
export async function requireAdmin(c: Context, next: Next) {
  const user = c.get('user');

  if (!user || !user.is_admin) {
    if (c.req.path.startsWith('/api/')) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    return c.redirect('/');
  }

  await next();
}
