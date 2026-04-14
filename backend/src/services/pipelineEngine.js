/**
 * Pipeline engine — all application state transitions go through here (per architecture spec).
 * Step 3: submitApplication with capacity check; concurrency via locking the jobs row (SELECT FOR UPDATE).
 * Step 4: promoteNextWaitlisted — SKIP LOCKED for concurrent promotions, decay timer + audit.
 */

const { pool } = require('../db/pool');
const { AppError } = require('../middleware/errorHandler');
const { sendPromotionAlert } = require('./notificationService');

/** @returns {number} Minutes until acknowledge deadline (promotion to active). */
function getAckWindowMinutes() {
  const n = Number(process.env.ACK_WINDOW_MINUTES ?? 120);
  if (!Number.isFinite(n) || n < 1) {
    return 120;
  }
  return Math.floor(n);
}

/**
 * Renumbers remaining `waitlisted` rows to contiguous 1..n (ordered by previous position).
 * @param {import('pg').PoolClient} client
 * @param {number} jobId
 */
async function compactWaitlistPositions(client, jobId) {
  await client.query(
    `WITH ordered AS (
       SELECT id,
              ROW_NUMBER() OVER (ORDER BY waitlist_position ASC NULLS LAST) AS rn
       FROM applications
       WHERE job_id = $1 AND status = 'waitlisted'
     )
     UPDATE applications AS a
     SET waitlist_position = o.rn,
         updated_at = NOW()
     FROM ordered AS o
     WHERE a.id = o.id`,
    [jobId]
  );
}

/**
 * Submit a new application for a job.
 *
 * Runs in a single transaction:
 * 1. Locks the job row with SELECT ... FOR UPDATE so concurrent submits serialize on this job.
 * 2. Counts rows with status = 'active' (current pipeline occupancy).
 * 3. If active_count < active_capacity → new row is `active`, waitlist_position NULL.
 * 4. Else → `waitlisted` with waitlist_position = MAX(waitlist_position)+1 among waitlisted rows.
 * 5. Writes audit_log (reason `submitted`).
 *
 * @param {number} jobId
 * @param {{ applicant_name: string, applicant_email: string }} data
 * @returns {Promise<object>} Inserted application row (RETURNING *)
 */
async function submitApplication(jobId, data) {
  const applicant_name = typeof data.applicant_name === 'string' ? data.applicant_name.trim() : '';
  const applicant_email = typeof data.applicant_email === 'string' ? data.applicant_email.trim() : '';

  if (!applicant_name) {
    throw new AppError(400, 'Field "applicant_name" is required.');
  }
  if (!applicant_email) {
    throw new AppError(400, 'Field "applicant_email" is required.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Serialize concurrent applications for the same job: second transaction blocks until first commits.
    const jobRes = await client.query(
      `SELECT id, status, active_capacity
       FROM jobs
       WHERE id = $1
       FOR UPDATE`,
      [jobId]
    );

    if (jobRes.rows.length === 0) {
      throw new AppError(404, 'Job not found.');
    }

    const job = jobRes.rows[0];
    if (job.status !== 'open') {
      throw new AppError(400, 'This job is not accepting applications.');
    }

    const activeRes = await client.query(
      `SELECT COUNT(*)::int AS c
       FROM applications
       WHERE job_id = $1 AND status IN ('active', 'ack_pending')`,
      [jobId]
    );
    const activeCount = activeRes.rows[0].c;

    let nextStatus;
    let waitlistPosition = null;

    if (activeCount < job.active_capacity) {
      nextStatus = 'active';
    } else {
      const maxRes = await client.query(
        `SELECT COALESCE(MAX(waitlist_position), 0)::int AS m
         FROM applications
         WHERE job_id = $1 AND status = 'waitlisted'`,
        [jobId]
      );
      waitlistPosition = maxRes.rows[0].m + 1;
      nextStatus = 'waitlisted';
    }

    const insertRes = await client.query(
      `INSERT INTO applications (
         job_id,
         applicant_name,
         applicant_email,
         status,
         waitlist_position,
         updated_at
       )
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [jobId, applicant_name, applicant_email, nextStatus, waitlistPosition]
    );
    const application = insertRes.rows[0];

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
       VALUES ($1, $2, NULL, $3, 'submitted', NULL, $4, 'user')`,
      [application.id, jobId, nextStatus, waitlistPosition]
    );

    await client.query('COMMIT');
    return application;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Promote the next waitlisted applicant to `ack_pending` when an active slot is available
 * (active_count strictly less than job capacity).
 *
 * Must be called **inside an open transaction** on `client`. Does not COMMIT, BEGIN, or RELEASE.
 *
 * Uses `SELECT … FOR UPDATE SKIP LOCKED` so two workers promoting the same job do not block each
 * other on different waitlisted rows; only one wins the next position.
 *
 * Steps: lock job → count `active` → if room, lock next waitlisted row → set `ack_pending` +
 * `ack_deadline` → upsert `decay_timers` → compact waitlist → audit (`reason` = `promoted`).
 *
 * @param {number} jobId
 * @param {import('pg').PoolClient} client
 * @returns {Promise<object|null>} Updated application row, or `null` if no promotion occurred
 */
async function promoteNextWaitlisted(jobId, client) {
  const jobRes = await client.query(
    `SELECT id, title, active_capacity
     FROM jobs
     WHERE id = $1
     FOR UPDATE`,
    [jobId]
  );

  if (jobRes.rows.length === 0) {
    throw new AppError(404, 'Job not found.');
  }

  const { active_capacity: capacity } = jobRes.rows[0];

  const activeRes = await client.query(
    `SELECT COUNT(*)::int AS c
     FROM applications
     WHERE job_id = $1 AND status IN ('active', 'ack_pending')`,
    [jobId]
  );
  const activeCount = activeRes.rows[0].c;

  if (activeCount >= capacity) {
    return null;
  }

  const nextRes = await client.query(
    `SELECT *
     FROM applications
     WHERE job_id = $1 AND status = 'waitlisted'
     ORDER BY waitlist_position ASC NULLS LAST
     FOR UPDATE SKIP LOCKED
     LIMIT 1`,
    [jobId]
  );

  if (nextRes.rows.length === 0) {
    return null;
  }

  const candidate = nextRes.rows[0];
  const waitlistPosBefore = candidate.waitlist_position;

  const minutes = getAckWindowMinutes();
  const ackDeadline = new Date(Date.now() + minutes * 60 * 1000);

  const updateRes = await client.query(
    `UPDATE applications
     SET status = 'ack_pending',
         ack_deadline = $1,
         waitlist_position = NULL,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [ackDeadline, candidate.id]
  );
  const application = updateRes.rows[0];

  await client.query(
    `INSERT INTO decay_timers (application_id, ack_deadline, is_processed)
     VALUES ($1, $2, FALSE)
     ON CONFLICT (application_id) DO UPDATE
     SET ack_deadline = EXCLUDED.ack_deadline,
         is_processed = FALSE`,
    [application.id, ackDeadline]
  );

  await compactWaitlistPositions(client, jobId);

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
     VALUES ($1, $2, 'waitlisted', 'ack_pending', 'promoted', $3, NULL, 'system')`,
    [application.id, jobId, waitlistPosBefore]
  );

  // Trigger mock notification (async, but we don't await blocking the transaction if it were real)
  sendPromotionAlert(application, jobRes.rows[0]).catch(e => console.error('Failed to send promotion alert:', e));

  return application;
}

const TERMINAL_STATUSES = new Set(['hired', 'rejected', 'withdrawn']);

/**
 * Move an application to a terminal status and cascade: may promote the next waitlisted candidate.
 *
 * Runs in its own transaction (acquires/releases a client). Caller must **not** pass a client.
 *
 * @param {number} applicationId
 * @param {'rejected'|'hired'|'withdrawn'} toStatus
 * @param {{ triggeredBy?: 'user'|'system' }} [options]
 * @returns {Promise<object>} Updated application row
 */
async function exitApplication(applicationId, toStatus, options = {}) {
  const { triggeredBy = 'user' } = options;
  const allowed = new Set(['rejected', 'hired', 'withdrawn']);
  if (!allowed.has(toStatus)) {
    throw new AppError(400, 'Invalid terminal status. Use rejected, hired, or withdrawn.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const appRes = await client.query(
      `SELECT * FROM applications WHERE id = $1 FOR UPDATE`,
      [applicationId]
    );
    if (appRes.rows.length === 0) {
      throw new AppError(404, 'Application not found.');
    }
    const app = appRes.rows[0];

    if (TERMINAL_STATUSES.has(app.status)) {
      throw new AppError(400, 'Application is already in a terminal state.');
    }

    const fromStatus = app.status;
    const wlBefore = app.waitlist_position;

    // Prevent meaningless company actions (hire from pipeline states only).
    if (toStatus === 'hired' && !['active', 'ack_pending'].includes(fromStatus)) {
      throw new AppError(
        400,
        'Hire is only allowed when the applicant is active or awaiting acknowledgement.'
      );
    }

    await client.query(
      `UPDATE decay_timers SET is_processed = TRUE WHERE application_id = $1`,
      [applicationId]
    );

    const updateRes = await client.query(
      `UPDATE applications
       SET status = $1,
           ack_deadline = NULL,
           waitlist_position = NULL,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [toStatus, applicationId]
    );
    const updated = updateRes.rows[0];

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
       VALUES ($1, $2, $3, $4, $5, $6, NULL, $7)`,
      [applicationId, app.job_id, fromStatus, toStatus, toStatus, wlBefore, triggeredBy]
    );

    await promoteNextWaitlisted(app.job_id, client);

    await client.query('COMMIT');
    return updated;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Applicant acknowledges promotion: `ack_pending` → `active`. Does not invoke promotion cascade
 * (this transition consumes the slot that was reserved for acknowledgement, not a free active slot).
 *
 * @param {number} applicationId
 * @param {{ applicant_email: string }} body
 */
async function acknowledgePromotion(applicationId, body) {
  const raw =
    typeof body.applicant_email === 'string' ? body.applicant_email.trim().toLowerCase() : '';
  if (!raw) {
    throw new AppError(400, 'Field "applicant_email" is required.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const appRes = await client.query(
      `SELECT * FROM applications WHERE id = $1 FOR UPDATE`,
      [applicationId]
    );
    if (appRes.rows.length === 0) {
      throw new AppError(404, 'Application not found.');
    }
    const app = appRes.rows[0];

    if (app.status !== 'ack_pending') {
      throw new AppError(400, 'Application is not awaiting acknowledgement.');
    }

    if (app.applicant_email.trim().toLowerCase() !== raw) {
      throw new AppError(403, 'Email does not match this application.');
    }

    await client.query(
      `UPDATE decay_timers SET is_processed = TRUE WHERE application_id = $1`,
      [applicationId]
    );

    const upd = await client.query(
      `UPDATE applications
       SET status = 'active',
           ack_deadline = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [applicationId]
    );

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
       VALUES ($1, $2, 'ack_pending', 'active', NULL, NULL, NULL, 'user')`,
      [applicationId, app.job_id]
    );

    await client.query('COMMIT');
    return upd.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  submitApplication,
  promoteNextWaitlisted,
  exitApplication,
  acknowledgePromotion,
};
