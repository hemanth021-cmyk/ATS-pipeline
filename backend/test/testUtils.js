/**
 * Test utilities — database setup/teardown, fixtures, and helpers.
 * Ensures proper cleanup to prevent test interference.
 */
const { pool } = require('../src/db/pool');

/**
 * Clear all application data (call before/after each test).
 * Preserves schema, companies, and jobs for seeding.
 */
async function clearApplicationData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query('DELETE FROM audit_log');
    await client.query('DELETE FROM decay_timers');
    await client.query('DELETE FROM applications');
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Reset all test data (full wipe except schema).
 */
async function resetDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query('DELETE FROM audit_log');
    await client.query('DELETE FROM decay_timers');
    await client.query('DELETE FROM applications');
    await client.query('DELETE FROM jobs');
    await client.query('DELETE FROM companies');
    
    // Reset sequences
    await client.query('ALTER SEQUENCE companies_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE jobs_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE applications_id_seq RESTART WITH 1');
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Create a test company (returns id).
 */
async function createTestCompany(name = 'Test Corp', email = 'test@example.com') {
  const res = await pool.query(
    `INSERT INTO companies (email, name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [email, name, 'hash']
  );
  return res.rows[0].id;
}

/**
 * Create a test job (returns full job object).
 */
async function createTestJob(companyId, title = 'Test Role', capacity = 3) {
  const res = await pool.query(
    `INSERT INTO jobs (company_id, title, active_capacity, status)
     VALUES ($1, $2, $3, 'open')
     RETURNING *`,
    [companyId, title, capacity]
  );
  return res.rows[0];
}

/**
 * Create a test application (returns full app object).
 */
async function createTestApplication(
  jobId,
  name = 'Test Applicant',
  email = 'applicant@example.com',
  status = 'active'
) {
  const res = await pool.query(
    `INSERT INTO applications (job_id, applicant_name, applicant_email, status)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [jobId, name, email, status]
  );
  return res.rows[0];
}

/**
 * Replicate high-concurrency burst: submit N applications rapidly.
 * @param {number} jobId
 * @param {number} count How many applications to submit
 * @returns {Promise<Array>} Array of application objects
 */
async function submitBurstApplications(jobId, count = 10) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(
      pool.query(
        `INSERT INTO applications (job_id, applicant_name, applicant_email, status)
         VALUES ($1, $2, $3, 'submitted')
         RETURNING *`,
        [jobId, `Applicant${i}`, `applicant${i}@test.com`]
      )
    );
  }
  const results = await Promise.all(promises);
  return results.map(r => r.rows[0]);
}

/**
 * Wait for pool to stabilize (allow any pending queries to complete).
 */
async function waitForPoolIdle() {
  // Give the pool a moment to catch up
  return new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Get current pipeline state for a job (for debugging/assertions).
 */
async function getJobState(jobId) {
  const res = await pool.query(
    `SELECT 
       status,
       COUNT(*)::int as count,
       ARRAY_AGG(applicant_name ORDER BY id) as names
     FROM applications 
     WHERE job_id = $1
     GROUP BY status
     ORDER BY status`,
    [jobId]
  );
  
  const state = {};
  res.rows.forEach(row => {
    state[row.status] = {
      count: parseInt(row.count, 10),
      names: row.names
    };
  });
  return state;
}

/**
 * Drain pool and clean up connections (call in test.after hook).
 */
async function cleanup() {
  try {
    const { drainPool } = require('../src/db/pool');
    await drainPool();
  } catch (err) {
    console.error('[testUtils:cleanup] Error draining pool:', err);
  }
}

module.exports = {
  clearApplicationData,
  resetDatabase,
  createTestCompany,
  createTestJob,
  createTestApplication,
  submitBurstApplications,
  waitForPoolIdle,
  getJobState,
  cleanup,
}