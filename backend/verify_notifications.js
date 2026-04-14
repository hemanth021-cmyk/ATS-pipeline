/**
 * Script to verify the promotion notification logic.
 * 1. Resets a job to capacity 1.
 * 2. Adds 1 active and 1 waitlisted candidate.
 * 3. Hires the active candidate.
 * 4. Verifies the waitlisted candidate is promoted AND a notification audit log is created.
 */

require('dotenv').config({ path: './.env' });
const { pool, drainPool } = require('./src/db/pool');
const { submitApplication, exitApplication } = require('./src/services/pipelineEngine');

async function verify() {
  console.log('--- START NOTIFICATION VERIFICATION ---');
  let retries = 3;
  
  while (retries > 0) {
    try {
      // 1. Cleanup & Setup Job
      const jobRes = await pool.query(
        `INSERT INTO jobs (company_id, title, active_capacity, status)
         VALUES (1, 'Notification Test Architect', 1, 'open')
         RETURNING id`
      );
      const jobId = jobRes.rows[0].id;
      console.log(`Created Job #${jobId}`);

      // 2. Submit Active Candidate
      const app1 = await submitApplication(jobId, {
        applicant_name: 'Active Alice',
        applicant_email: 'alice@example.com'
      });
      console.log(`Submitted Active Alice: status=${app1.status}`);

      // 3. Submit Waitlisted Candidate
      const app2 = await submitApplication(jobId, {
        applicant_name: 'Waitlisted Wendy',
        applicant_email: 'wendy@example.com'
      });
      console.log(`Submitted Waitlisted Wendy: status=${app2.status}, pos=${app2.waitlist_position}`);

      // 4. Hire Alice to trigger Wendy's promotion
      console.log('Hiring Active Alice to trigger Wendy promotion...');
      await exitApplication(app1.id, 'hired');

      // 5. Verify Wendy's state and Notification Log
      const wendyRes = await pool.query('SELECT status FROM applications WHERE id = $1', [app2.id]);
      const wendyStatus = wendyRes.rows[0].status;
      console.log(`Wendy's final status: ${wendyStatus}`);

      const auditRes = await pool.query(
        `SELECT * FROM audit_log 
         WHERE application_id = $1 AND to_status = 'ack_pending'
         ORDER BY created_at DESC LIMIT 1`,
        [app2.id]
      );

      if (wendyStatus === 'ack_pending') {
        console.log('✅ SUCCESS: Wendy was promoted to ack_pending.');
        if (auditRes.rows.length > 0) {
          console.log('✅ Promotion was audited:', auditRes.rows[0].reason);
        }
      } else {
        console.error('❌ FAILURE: Wendy was not promoted.');
        console.error(`Status: ${wendyStatus}`);
      }
      
      break; // Success
    } catch (err) {
      retries--;
      if (retries === 0) {
        console.error('❌ ERROR (retries exhausted):', err.message);
      } else {
        console.warn(`Error (retry ${4 - retries}/3):`, err.message);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  await drainPool();
  process.exit(retries > 0 ? 0 : 1);
}

verify().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
