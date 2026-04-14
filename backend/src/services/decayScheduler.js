/**
 * In-process decay scheduler — no Redis/Bull/cron packages.
 * Fires on a fixed interval (default 60s), processes expired rows in `decay_timers`.
 *
 * Each expiry is handled in its own DB transaction: lock application → verify `ack_pending` →
 * reposition with penalty → mark timer processed → audit (`reason` = `decay`) →
 * `promoteNextWaitlisted` (cascade).
 */

const { pool } = require('../db/pool');
const { promoteNextWaitlisted } = require('./pipelineEngine');

const DEFAULT_INTERVAL_MS = 60_000;

/** @type {ReturnType<typeof setInterval> | null} */
let intervalId = null;

/**
 * Process one expired timer row (expects columns: id, application_id, ack_deadline).
 * Stale rows (application missing or no longer `ack_pending`) only mark the timer processed.
 *
 * Penalty formula (spec): new_position = MAX(waitlist_position) + 1 + (penalty_count * 3)
 * using penalty_count **before** incrementing for this decay event.
 *
 * @param {{ id: number, application_id: number }} timerRow
 */
async function processExpiredTimer(timerRow) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const appRes = await client.query(
      `SELECT * FROM applications WHERE id = $1 FOR UPDATE`,
      [timerRow.application_id]
    );

    if (appRes.rows.length === 0) {
      await client.query(`UPDATE decay_timers SET is_processed = TRUE WHERE id = $1`, [timerRow.id]);
      await client.query('COMMIT');
      return;
    }

    const app = appRes.rows[0];

    if (app.status !== 'ack_pending') {
      await client.query(`UPDATE decay_timers SET is_processed = TRUE WHERE id = $1`, [timerRow.id]);
      await client.query('COMMIT');
      return;
    }

    const maxRes = await client.query(
      `SELECT COALESCE(MAX(waitlist_position), 0)::int AS m
       FROM applications
       WHERE job_id = $1 AND status = 'waitlisted'`,
      [app.job_id]
    );
    const maxWl = maxRes.rows[0].m;
    const penaltyBefore = Number(app.penalty_count) || 0;
    const newPosition = maxWl + 1 + penaltyBefore * 3;

    await client.query(
      `UPDATE applications
       SET status = 'waitlisted',
           waitlist_position = $1,
           penalty_count = penalty_count + 1,
           ack_deadline = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [newPosition, app.id]
    );

    await client.query(`UPDATE decay_timers SET is_processed = TRUE WHERE id = $1`, [timerRow.id]);

    await client.query(
      `INSERT INTO audit_log (
         application_id,
         job_id,
         from_status,
         to_status,
         reason,
         waitlist_pos_before,
         waitlist_pos_after,
         triggered_by
       )
       VALUES ($1, $2, 'ack_pending', 'waitlisted', 'decay', NULL, $3, 'decay_scheduler')`,
      [app.id, app.job_id, newPosition]
    );

    await promoteNextWaitlisted(app.job_id, client);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Prevents overlapping ticks if a run is slower than the interval. */
let decayCheckRunning = false;

/**
 * Finds expired, unprocessed decay timers and processes them sequentially (oldest deadline first).
 */
async function runDecayCheck() {
  if (decayCheckRunning) {
    return;
  }
  decayCheckRunning = true;
  try {
    const res = await pool.query(
      `SELECT id, application_id, ack_deadline
       FROM decay_timers
       WHERE ack_deadline < NOW() AND is_processed = FALSE
       ORDER BY ack_deadline ASC`
    );

    for (const row of res.rows) {
      try {
        await processExpiredTimer(row);
      } catch (err) {
        console.error('[decay_scheduler] Timer', row.id, 'failed:', err.message || err);
      }
    }
  } finally {
    decayCheckRunning = false;
  }
}

/**
 * Starts the repeating decay check. Safe to call once at process startup.
 */
function startDecayScheduler() {
  if (intervalId !== null) {
    return;
  }

  const raw = Number(process.env.DECAY_CHECK_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);
  const intervalMs = Number.isFinite(raw) && raw >= 1000 ? Math.floor(raw) : DEFAULT_INTERVAL_MS;

  intervalId = setInterval(() => {
    runDecayCheck().catch((err) => {
      console.error('[decay_scheduler] runDecayCheck error:', err.message || err);
    });
  }, intervalMs);

  console.log(`[decay_scheduler] Running every ${intervalMs}ms`);
}

/**
 * Stops the interval (e.g. graceful shutdown).
 */
function stopDecayScheduler() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = {
  startDecayScheduler,
  stopDecayScheduler,
  runDecayCheck,
  processExpiredTimer,
};
