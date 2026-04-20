#!/usr/bin/env bun
/**
 * Migration: add signer_type column to petition_signers
 *
 * Run once against Turso:
 *   TURSO_URL=... TURSO_AUTH_TOKEN=... bun run scripts/migrate-signer-type.ts
 */

import { client } from '../src/db/client';

try {
  await client.execute(
    "ALTER TABLE petition_signers ADD COLUMN signer_type TEXT CHECK(signer_type IN ('business_owner','employee','concerned_citizen')) DEFAULT NULL"
  );
  console.log('Migration complete: signer_type column added.');
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('duplicate column')) {
    console.log('Column already exists, skipping.');
  } else {
    console.error('Migration failed:', msg);
    process.exit(1);
  }
}
