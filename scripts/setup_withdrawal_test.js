const { pool } = require('../backend/src/db/pool');
const { submitApplication } = require('../backend/src/services/pipelineEngine');

async function setup() {
  try {
    await pool.query('TRUNCATE table companies, jobs CASCADE');
    const compRes = await pool.query(
      `INSERT INTO companies (email, password_hash, name) VALUES ('test@acme.com', 'hash', 'Acme Corp') RETURNING id`
    );
    const compId = compRes.rows[0].id;
    
    const jobRes = await pool.query(
      `INSERT INTO jobs (company_id, title, active_capacity, status) VALUES ($1, 'Backend Engineer', 1, 'open') RETURNING id`,
      [compId]
    );
    const jobId = jobRes.rows[0].id;
    
    const a1 = await submitApplication(jobId, { applicant_name: 'Alice', applicant_email: 'alice@test.com' });
    const a2 = await submitApplication(jobId, { applicant_name: 'Bob', applicant_email: 'bob@test.com' });
    
    console.log('--- TEST DATA READY ---');
    console.log(`Alice (Active): http://localhost:5173/status?id=${a1.id}`);
    console.log(`Bob (Waitlist): http://localhost:5173/status?id=${a2.id}`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

setup();
