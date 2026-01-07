# LIFT Philly Coalition Tracker

A web application for tracking coalition members, partners, and stakeholders for LIFT Philly.

**Live at:** https://data.liftphilly.org

## Features

- Track organizations, individuals, businesses, and elected officials
- Status tracking (prospect → contacted → active → inactive)
- Multi-user authentication with role-based permissions
- Full audit logging with change history per member
- Admin panel for user management
- Responsive design (desktop inline edit, mobile drawer)
- Containerized deployment with Podman

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Database**: SQLite (WAL mode)
- **Container**: Podman

## User Roles

| Role   | View | Add/Edit | Delete | Manage Users |
|--------|------|----------|--------|--------------|
| Viewer | Yes  | No       | No     | No           |
| Editor | Yes  | Yes      | No     | No           |
| Admin  | Yes  | Yes      | Yes    | Yes          |

## Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev
```

The app runs on port 3848.

## Production Deployment

```bash
# Build and run with Podman
podman-compose up -d

# View logs
podman logs -f coalition-tracker
```

## User Management

### Via Web (Admin Panel)

Admins can manage users at `/admin` - add, edit roles, reset passwords, and delete users.

### Via CLI

Run commands inside the container:

```bash
# List all users
podman exec coalition-tracker bun run scripts/create-user.ts list

# Create a new user (defaults to viewer role)
podman exec coalition-tracker bun run scripts/create-user.ts <username> <password> "<Display Name>"

# Create user with specific role
podman exec coalition-tracker bun run scripts/create-user.ts <username> <password> "<Display Name>" --role=editor
podman exec coalition-tracker bun run scripts/create-user.ts <username> <password> "<Display Name>" --role=admin

# Change a user's password
podman exec coalition-tracker bun run scripts/create-user.ts passwd <username> '<new_password>'
```

### Examples

```bash
# Create admin user
podman exec coalition-tracker bun run scripts/create-user.ts alex secretpass "Alex Hillman" --role=admin

# Create editor user
podman exec coalition-tracker bun run scripts/create-user.ts sarah pass123 "Sarah Smith" --role=editor

# Create viewer user (default)
podman exec coalition-tracker bun run scripts/create-user.ts guest pass123 "Guest User"

# Change password (use single quotes for special characters)
podman exec coalition-tracker bun run scripts/create-user.ts passwd alex 'NewP@ss!word'
```

## Database

SQLite database is stored at `/data/liftphilly.db` inside the container, mounted from `./data/` on the host.

### Tables

- `coalition` - Member records
- `users` - User accounts with roles
- `sessions` - Login sessions (7-day expiry)
- `audit_log` - Change history

## Audit Logging

All create, update, and delete operations are logged with:
- Who made the change
- What changed (old vs new values)
- When it happened

View history for any member by clicking the "History" button in the edit panel.
