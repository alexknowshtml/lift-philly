import { client } from '../src/db/client';
const res = await client.execute('SELECT id, name, email, created_at FROM petition_signers ORDER BY created_at DESC');
for (const row of res.rows) console.log(row.id, '|', row.name, '|', row.email);
