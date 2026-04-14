require('dotenv').config({ path: './.env' });
const { pool, drainPool } = require('./src/db/pool');
const { runDecayCheck } = require('./src/services/decayScheduler');

async function run() {
  let retries = 3;
  
  while (retries > 0) {
    try {
      const jobId = 11;
      console.log(`Verifying Job ${jobId}...`);

      const bobRes = await pool.query("SELECT id FROM applications WHERE applicant_name = 'Bob' AND job_id = $1", [jobId]);
      if (bobRes.rows.length === 0) {
        console.log('Bob not found');
        break;
      }
      const bobId = bobRes.rows[0].id;

      console.log(`Expiring Bob (ID: ${bobId})...`);
      await pool.query("UPDATE decay_timers SET ack_deadline = NOW() - INTERVAL '1 hour' WHERE application_id = $1", [bobId]);
      await pool.query("UPDATE applications SET ack_deadline = NOW() - INTERVAL '1 hour' WHERE id = $1", [bobId]);

      console.log('Running decay check...');
      await runDecayCheck();

      console.log('\n--- Final States ---');
      const apps = await pool.query("SELECT applicant_name, status, waitlist_position, penalty_count FROM applications WHERE job_id = $1 ORDER BY id ASC", [jobId]);
      apps.rows.forEach(app => {
        console.log(`${app.applicant_name}: status=${app.status}, pos=${app.waitlist_position}, penalty=${app.penalty_count}`);
      });

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
