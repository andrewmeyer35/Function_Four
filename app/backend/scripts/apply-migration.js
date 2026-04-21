// Apply SQL migration files to Supabase Postgres via the direct URL.
// Usage: node scripts/apply-migration.js <migration-file.sql>
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load .env manually (no dotenv dep)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const file = process.argv[2];
if (!file) { console.error('usage: node apply-migration.js <file.sql>'); process.exit(1); }
const sql = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const connectionString = process.env.DIRECT_URL;
if (!connectionString) { console.error('DIRECT_URL not set'); process.exit(1); }

(async () => {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('connected to', connectionString.replace(/:[^:@]+@/, ':***@'));
    await client.query(sql);
    console.log('migration applied ✓');

    const r = await client.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `);
    console.log('public tables:', r.rows.map(x => x.table_name));
  } catch (e) {
    console.error('MIGRATION FAILED:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
