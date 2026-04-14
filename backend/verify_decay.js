require('dotenv').config({ path: './.env' });
const { pool, drainPool } = require('./src/db/pool');
const { runDecayCheck } = require('./src/services/decayScheduler');

async function run() {
  let retries = 3;
  
  while (retries > 0) {
    try {
      const bobRes = await pool.query("SELECT id FROM applications WHERE applicant_name = 'Bob' ORDER BY id DESC LIMIT 1");
      if (bobRes.rows.length === 0) {
        console.log('Bob not found');
        break;
      }
      const bobId = bobRes.rows[0].id;

      console.log(`Forcing Bob (ID: ${bobId}) to expired...`);
      // Set ack_deadline to 1 hour ago
      await pool.query("UPDATE decay_timers SET ack_deadline = NOW() - INTERVAL '1 hour' WHERE application_id = $1", [bobId]);
      await pool.query("UPDATE applications SET ack_deadline = NOW() - INTERVAL '1 hour' WHERE id = $1", [bobId]);

      console.log('Running decay check...');
      await runDecayCheck();

      const updatedRes = await pool.query("SELECT * FROM applications WHERE id = $1", [bobId]);
      const updated = updatedRes.rows[0];
      console.log(`Bob status is now: ${updated.status}`);
      console.log(`Bob penalty count: ${updated.penalty_count}`);
      console.log(`Bob position: ${updated.waitlist_position}`);

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
