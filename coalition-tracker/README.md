# LIFT Philly Coalition Tracker

A web application for tracking coalition members, partners, and stakeholders for LIFT Philly.

## Features

- Track organizations, individuals, businesses, and elected officials
- Status tracking (prospect → contacted → active → inactive)
- Multi-user authentication with audit logging
- Full change history per member
- Responsive design (desktop inline edit, mobile drawer)
- Containerized deployment with Podman

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Database**: SQLite (WAL mode)
- **Container**: Podman

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

Users are managed via CLI. Run commands inside the container:

```bash
# List all users
podman exec coalition-tracker bun run scripts/create-user.ts list

# Create a new user
podman exec coalition-tracker bun run scripts/create-user.ts <username> <password> "<Display Name>"

# Create an admin user
podman exec coalition-tracker bun run scripts/create-user.ts <username> <password> "<Display Name>" --admin

# Change a user's password
podman exec coalition-tracker bun run scripts/create-user.ts passwd <username> <new_password>
```

### Examples

```bash
# Create admin user
podman exec coalition-tracker bun run scripts/create-user.ts alex secretpass "Alex Hillman" --admin

# Create regular user
podman exec coalition-tracker bun run scripts/create-user.ts sarah pass123 "Sarah Smith"

# Change password
podman exec coalition-tracker bun run scripts/create-user.ts passwd alex newSecurePassword
```

## Database

SQLite database is stored at `/data/liftphilly.db` inside the container, mounted from `./data/` on the host.

### Tables

- `coalition` - Member records
- `users` - User accounts
- `sessions` - Login sessions (7-day expiry)
- `audit_log` - Change history

## Audit Logging

All create, update, and delete operations are logged with:
- Who made the change
- What changed (old vs new values)
- When it happened

View history for any member by clicking the "History" button in the edit panel.
