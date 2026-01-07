# User Authentication & Audit Log Implementation

## Overview

Add multi-user authentication with full audit logging to track all changes made to coalition members.

## Database Changes

### New Tables

**1. `users` table**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**2. `audit_log` table**
```sql
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,  -- 'create', 'update', 'delete'
  member_id INTEGER NOT NULL,
  changes TEXT,  -- JSON of what changed (for updates)
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Modify `coalition` table
- Add `created_by INTEGER` (foreign key to users)
- Add `updated_by INTEGER` (foreign key to users)

## Authentication Flow

1. **Login page** - Username/password form at `/login`
2. **Session cookies** - Secure HTTP-only cookie with session token
3. **Sessions table** - Store active sessions in SQLite
4. **Middleware** - Protect all `/api/*` routes and `/` UI route
5. **Logout** - Clear session cookie and delete from sessions table

## API Changes

### New Endpoints
- `POST /login` - Authenticate user, set session cookie
- `POST /logout` - Clear session
- `GET /api/me` - Get current user info
- `GET /api/audit-log` - View audit log (paginated)
- `GET /api/audit-log/:memberId` - Audit log for specific member

### Modified Endpoints
All existing member endpoints will:
1. Require authentication (401 if no valid session)
2. Log changes to audit_log table
3. Set created_by/updated_by on member records

## UI Changes

1. **Login page** - Simple form before accessing main UI
2. **User indicator** - Show logged-in user in header
3. **Logout button** - In header
4. **Audit display** - Show "Last edited by X" in edit panel
5. **History view** - Optional: button to view change history for a member

## Implementation Steps

1. Add new database tables and migrations
2. Create password hashing utilities (using Bun's crypto)
3. Add sessions table and session management
4. Create auth middleware for Hono
5. Build login page and login/logout endpoints
6. Update all member endpoints to:
   - Check auth
   - Log to audit_log
   - Set created_by/updated_by
7. Update UI with login flow and user display
8. Create initial admin user (seeded or via CLI)

## Security Considerations

- Passwords hashed with bcrypt (or Bun's native crypto)
- Session tokens are random UUIDs
- HTTP-only, secure cookies (when on HTTPS)
- Session expiry (e.g., 7 days)
- Rate limiting on login attempts (optional, can add later)

## Admin User Creation

Since admin-only user management, we'll need a way to create the first user:
- CLI command: `bun run create-user <username> <password> [--admin]`
- Or: seed script that runs on first startup if no users exist
