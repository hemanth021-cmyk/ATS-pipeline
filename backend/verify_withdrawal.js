/**
 * verify_withdrawal.js
 * Verifies that withdrawing an application triggers the promotion cascade.
 */
require('dotenv').config();
const { pool, drainPool } = require('./src/db/pool');
const { exitApplication } = require('./src/services/pipelineEngine');

async function run() {
  let retries = 3;
  
  while (retries > 0) {
    try {
      const jobId = 11; // From Step 4 setup
      console.log(`Verifying Withdrawal Cascade for Job ${jobId}...`);

      // 1. Find a candidate in a status that can withdraw (e.g. active or ack_pending)
      const activeRes = await pool.query(
        "SELECT id, applicant_name, status FROM applications WHERE job_id = $1 AND status IN ('active', 'ack_pending') LIMIT 1",
        [jobId]
      );

      if (activeRes.rows.length === 0) {
        console.log("No active/pending candidates found.");
        break;
      }

      const candidate = activeRes.rows[0];
      console.log(`Withdrawing ${candidate.applicant_name} (ID: ${candidate.id}, Status: ${candidate.status})...`);

      // 2. Execute Withdrawal
      await exitApplication(candidate.id, 'withdrawn', { triggeredBy: 'user' });

      // 3. Verify next promotion
      const nextRes = await pool.query(
        "SELECT id, applicant_name, status FROM applications WHERE job_id = $1 AND status = 'ack_pending'",
        [jobId]
      );

      console.log("--- Results ---");
      console.log(`Withdrawn: ${candidate.applicant_name} -> status='withdrawn'`);
      
      if (nextRes.rows.length > 0) {
        console.log(`Success: ${nextRes.rows[0].applicant_name} was automatically promoted to 'ack_pending'.`);
      } else {
        console.log("Note: No one was promoted (maybe waitlist is empty).");
      }

      break; // Success
    } catch (err) {
      retries--;
      if (retries === 0) {
        console.error('Error (retries exhausted):', err.message);
      } else {
        console.warn(`Error (retry ${4 - retries}/3):`, err.message);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  await drainPool();
  process.exit(retries > 0 ? 0 : 1);
}

run().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

run();
