#!/usr/bin/env bun
/**
 * CLI script to create users for the coalition tracker
 *
 * Usage:
 *   bun run scripts/create-user.ts <username> <password> <display_name> [--admin]
 *
 * Examples:
 *   bun run scripts/create-user.ts alex secret123 "Alex Hillman" --admin
 *   bun run scripts/create-user.ts member pass123 "Team Member"
 */

import { getDatabase, createUser, getUserByUsername, getAllUsers, updateUserPassword } from '../src/db/client';
import { hashPassword } from '../src/auth/utils';

async function main() {
  const args = process.argv.slice(2);

  // Handle list command
  if (args[0] === 'list') {
    getDatabase(); // Initialize DB
    const users = getAllUsers();
    console.log('\nExisting users:');
    console.log('─'.repeat(60));
    for (const user of users) {
      console.log(`  ${user.username.padEnd(20)} ${user.display_name.padEnd(25)} ${user.is_admin ? '[ADMIN]' : ''}`);
    }
    console.log('─'.repeat(60));
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
Usage: bun run scripts/create-user.ts <username> <password> <display_name> [--admin]

Commands:
  list                              List all existing users
  passwd <username> <new_password>  Change a user's password

Arguments:
  username      Unique login name (no spaces)
  password      User password
  display_name  Name shown in the UI (use quotes for spaces)
  --admin       Give admin privileges (optional)

Examples:
  bun run scripts/create-user.ts alex secret123 "Alex Hillman" --admin
  bun run scripts/create-user.ts member pass123 "Team Member"
  bun run scripts/create-user.ts list
  bun run scripts/create-user.ts passwd alex newSecurePassword123
`);
    process.exit(1);
  }

  const username = args[0];
  const password = args[1];
  const displayName = args[2];
  const isAdmin = args.includes('--admin');

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
  console.log(`Creating user '${username}'...`);
  const passwordHash = await hashPassword(password);
  const user = createUser(username, passwordHash, displayName, isAdmin);

  console.log(`
✓ User created successfully!

  Username:     ${user.username}
  Display Name: ${user.display_name}
  Admin:        ${user.is_admin ? 'Yes' : 'No'}
  Created:      ${user.created_at}
`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
