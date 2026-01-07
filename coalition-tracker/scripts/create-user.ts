#!/usr/bin/env bun
/**
 * CLI script to manage users for the coalition tracker
 *
 * Usage:
 *   bun run scripts/create-user.ts <username> <password> <display_name> [--role=viewer|editor|admin]
 *
 * Examples:
 *   bun run scripts/create-user.ts alex secret123 "Alex Hillman" --role=admin
 *   bun run scripts/create-user.ts sarah pass123 "Sarah Smith" --role=editor
 *   bun run scripts/create-user.ts member pass123 "Team Member"  # defaults to viewer
 */

import { getDatabase, createUser, getUserByUsername, getAllUsers, updateUserPassword, type UserRole } from '../src/db/client';
import { hashPassword } from '../src/auth/utils';

async function main() {
  const args = process.argv.slice(2);

  // Handle list command
  if (args[0] === 'list') {
    getDatabase(); // Initialize DB
    const users = getAllUsers();
    console.log('\nExisting users:');
    console.log('─'.repeat(70));
    console.log(`  ${'USERNAME'.padEnd(18)} ${'DISPLAY NAME'.padEnd(25)} ${'ROLE'.padEnd(10)}`);
    console.log('─'.repeat(70));
    for (const user of users) {
      const roleDisplay = user.role.toUpperCase();
      console.log(`  ${user.username.padEnd(18)} ${user.display_name.padEnd(25)} ${roleDisplay.padEnd(10)}`);
    }
    console.log('─'.repeat(70));
    console.log(`Total: ${users.length} user(s)\n`);
    process.exit(0);
  }

  // Handle passwd command
  if (args[0] === 'passwd') {
    if (args.length < 3) {
      console.error(`
Usage: bun run scripts/create-user.ts passwd <username> <new_password>

Example:
  bun run scripts/create-user.ts passwd alex newSecurePassword123
`);
      process.exit(1);
    }

    const username = args[1];
    const newPassword = args[2];

    if (newPassword.length < 6) {
      console.error('Error: Password must be at least 6 characters');
      process.exit(1);
    }

    getDatabase(); // Initialize DB

    const existing = getUserByUsername(username);
    if (!existing) {
      console.error(`Error: User '${username}' not found`);
      process.exit(1);
    }

    console.log(`Changing password for '${username}'...`);
    const newPasswordHash = await hashPassword(newPassword);
    updateUserPassword(username, newPasswordHash);

    console.log(`
✓ Password changed successfully for '${username}'!
`);
    process.exit(0);
  }

  // Validate arguments
  if (args.length < 3) {
    console.error(`
Usage: bun run scripts/create-user.ts <username> <password> <display_name> [--role=viewer|editor|admin]

Commands:
  list                              List all existing users
  passwd <username> <new_password>  Change a user's password

Arguments:
  username      Unique login name (no spaces)
  password      User password
  display_name  Name shown in the UI (use quotes for spaces)
  --role=X      Set role: viewer (default), editor, or admin

Roles:
  viewer  - Can view data only
  editor  - Can view, add, and edit data
  admin   - Full access including delete and user management

Examples:
  bun run scripts/create-user.ts alex secret123 "Alex Hillman" --role=admin
  bun run scripts/create-user.ts sarah pass123 "Sarah Smith" --role=editor
  bun run scripts/create-user.ts member pass123 "Team Member"
  bun run scripts/create-user.ts list
  bun run scripts/create-user.ts passwd alex newSecurePassword123
`);
    process.exit(1);
  }

  const username = args[0];
  const password = args[1];
  const displayName = args[2];

  // Parse role from --role=X or --admin (legacy support)
  let role: UserRole = 'viewer';
  const roleArg = args.find(a => a.startsWith('--role='));
  if (roleArg) {
    const roleValue = roleArg.split('=')[1];
    if (!['viewer', 'editor', 'admin'].includes(roleValue)) {
      console.error(`Error: Invalid role '${roleValue}'. Must be viewer, editor, or admin`);
      process.exit(1);
    }
    role = roleValue as UserRole;
  } else if (args.includes('--admin')) {
    // Legacy support
    role = 'admin';
  }

  // Validate username
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    console.error('Error: Username can only contain letters, numbers, underscores, and hyphens');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('Error: Password must be at least 6 characters');
    process.exit(1);
  }

  // Initialize database
  getDatabase();

  // Check if user already exists
  const existing = getUserByUsername(username);
  if (existing) {
    console.error(`Error: User '${username}' already exists`);
    process.exit(1);
  }

  // Hash password and create user
  console.log(`Creating user '${username}' with role '${role}'...`);
  const passwordHash = await hashPassword(password);
  const user = createUser(username, passwordHash, displayName, role);

  console.log(`
✓ User created successfully!

  Username:     ${user.username}
  Display Name: ${user.display_name}
  Role:         ${user.role}
  Created:      ${user.created_at}
`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
