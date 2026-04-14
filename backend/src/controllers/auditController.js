/**
 * Read-only audit APIs for companies (JWT via Authorization: Bearer).
 * All state transitions are written in pipelineEngine / decayScheduler (Steps 3–6).
 */
const { pool } = require('../db/pool');
const { AppError } = require('../middleware/errorHandler');

const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 2000;

function parseLimit(req) {
  const raw = req.query?.limit;
  if (raw === undefined || raw === null || raw === '') {
    return DEFAULT_LIMIT;
  }
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(n, MAX_LIMIT);
}

function parseOffset(req) {
  const raw = req.query?.offset;
  if (raw === undefined || raw === null || raw === '') {
    return 0;
  }
  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * GET /api/jobs/:id/audit
 * Query: limit (default 500, max 2000), offset (default 0)
 */
async function getJobAudit(req, res, next) {
  try {
    const jobId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(jobId) || jobId < 1) {
      throw new AppError(400, 'Invalid job id.');
    }

    const jobCheck = await pool.query(`SELECT id FROM jobs WHERE id = $1 AND company_id = $2`, [
      jobId,
      req.companyId,
    ]);
    if (jobCheck.rows.length === 0) {
      const any = await pool.query(`SELECT id FROM jobs WHERE id = $1`, [jobId]);
      if (any.rows.length === 0) {
        throw new AppError(404, 'Job not found.');
      }
      throw new AppError(403, 'You do not have access to this job.');
    }

    const limit = parseLimit(req);
    const offset = parseOffset(req);

    const result = await pool.query(
      `SELECT *
       FROM audit_log
       WHERE job_id = $1
       ORDER BY created_at ASC, id ASC
       LIMIT $2 OFFSET $3`,
      [jobId, limit, offset]
    );

    res.json({
      job_id: jobId,
      entries: result.rows,
      limit,
      offset,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/applications/:id/audit
 * Query: limit, offset — same semantics as job audit.
 */
async function getApplicationAudit(req, res, next) {
  try {
    const applicationId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(applicationId) || applicationId < 1) {
      throw new AppError(400, 'Invalid application id.');
    }

    const access = await pool.query(
      `SELECT a.id
       FROM applications AS a
       INNER JOIN jobs AS j ON j.id = a.job_id
       WHERE a.id = $1 AND j.company_id = $2`,
      [applicationId, req.companyId]
    );
    if (access.rows.length === 0) {
      const any = await pool.query(`SELECT id FROM applications WHERE id = $1`, [applicationId]);
      if (any.rows.length === 0) {
        throw new AppError(404, 'Application not found.');
      }
      throw new AppError(403, 'You do not have access to this application.');
    }

    const limit = parseLimit(req);
    const offset = parseOffset(req);

    const result = await pool.query(
      `SELECT *
       FROM audit_log
       WHERE application_id = $1
       ORDER BY created_at ASC, id ASC
       LIMIT $2 OFFSET $3`,
      [applicationId, limit, offset]
    );

    res.json({
      application_id: applicationId,
      entries: result.rows,
      limit,
      offset,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getJobAudit,
  getApplicationAudit,
};
