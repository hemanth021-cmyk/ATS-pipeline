/**
 * Runs src/db/init.sql against DATABASE_URL (for local/dev bootstrap).
 * Requires: DATABASE_URL in .env or environment.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required to run migrations.');
    process.exit(1);
  }
  const sqlPath = path.join(__dirname, '..', 'src', 'db', 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(sql);
    console.log('Applied init.sql successfully.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
