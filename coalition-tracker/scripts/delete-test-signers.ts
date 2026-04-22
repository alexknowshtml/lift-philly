import { client } from '../src/db/client';
const res = await client.execute(
  "DELETE FROM petition_signers WHERE email LIKE '%@seed.test' OR email IN ('test@test.com','test@trest.com','test@example.com')"
);
console.log('Deleted rows:', res.rowsAffected);
