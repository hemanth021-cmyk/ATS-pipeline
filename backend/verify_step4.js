require('dotenv').config({ path: './.env' });
const { pool, drainPool } = require('./src/db/pool');
const { exitApplication } = require('./src/services/pipelineEngine');

async function run() {
  let retries = 3;
  
  while (retries > 0) {
    try {
      const res = await pool.query("SELECT id FROM applications WHERE applicant_name = 'Alice' ORDER BY id DESC LIMIT 1");
      if (res.rows.length === 0) {
        console.log('Alice not found');
        break;
      }
      const aliceId = res.rows[0].id;
      console.log(`Rejecting Alice (ID: ${aliceId})...`);

      const updated = await exitApplication(aliceId, 'rejected', { triggeredBy: 'user' });
      console.log(`Alice status is now: ${updated.status}`);

      const bobRes = await pool.query("SELECT * FROM applications WHERE applicant_name = 'Bob' ORDER BY id DESC LIMIT 1");
      if (bobRes.rows.length > 0) {
        const bob = bobRes.rows[0];
        console.log(`Bob status is now: ${bob.status}`);
        console.log(`Bob queue position: ${bob.waitlist_position}`);
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
