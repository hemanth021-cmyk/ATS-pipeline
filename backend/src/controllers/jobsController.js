/**
 * HTTP handlers for /api/jobs.
 * Business rules for applications and pipeline locking live in services (later steps).
 */
const { pool } = require('../db/pool');
const { AppError } = require('../middleware/errorHandler');

const JOB_STATUSES = new Set(['open', 'closed']);
const APPLICATION_STATUSES = [
  'submitted',
  'waitlisted',
  'active',
  'ack_pending',
  'hired',
  'rejected',
  'withdrawn',
];

/**
 * POST /api/jobs
 * Body per spec: { title, description?, active_capacity }
 * company_id comes from JWT (req.companyId) after register/login.
 */
async function createJob(req, res, next) {
  try {
    const { title, description, active_capacity } = req.body ?? {};
    if (typeof title !== 'string' || title.trim().length === 0) {
      throw new AppError(400, 'Field "title" is required and must be a non-empty string.');
    }
    const cap = Number(active_capacity);
    if (!Number.isFinite(cap) || cap < 1 || !Number.isInteger(cap)) {
      throw new AppError(400, 'Field "active_capacity" is required and must be a positive integer.');
    }

    const desc =
      description === undefined || description === null ? null : String(description);

    const result = await pool.query(
      `INSERT INTO jobs (company_id, title, description, active_capacity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.companyId, title.trim(), desc, cap]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/jobs
 * List all jobs for the authenticated company (header-scoped for now).
 */
async function listJobs(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT *
       FROM jobs
       WHERE company_id = $1
       ORDER BY created_at DESC`,
      [req.companyId]
    );
    res.json({ jobs: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Per-status application counts for a single job (pipeline snapshot).
 */
function buildCountsSelect(jobIdParam) {
  const parts = APPLICATION_STATUSES.map(
    (st) =>
      `(SELECT COUNT(*)::int FROM applications WHERE job_id = ${jobIdParam} AND status = '${st}') AS ${st}_count`
  );
  return parts.join(',\n       ');
}

/**
 * GET /api/jobs/:id
 * Job row plus aggregate counts by application status.
 */
async function getJobById(req, res, next) {
  try {
    const jobId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(jobId) || jobId < 1) {
      throw new AppError(400, 'Invalid job id.');
    }

    const countSelect = buildCountsSelect('$1');

    const result = await pool.query(
      `SELECT j.*,
       ${countSelect},
       (SELECT COUNT(*)::int FROM applications WHERE job_id = $1) AS total_applications
       FROM jobs j
       WHERE j.id = $1 AND j.company_id = $2`,
      [jobId, req.companyId]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Job not found.');
    }

    const row = result.rows[0];
    const counts = {};
    for (const st of APPLICATION_STATUSES) {
      counts[st] = row[`${st}_count`];
    }

    const job = {
      id: row.id,
      company_id: row.company_id,
      title: row.title,
      description: row.description,
      active_capacity: row.active_capacity,
      status: row.status,
      created_at: row.created_at,
    };

    res.json({
      job,
      pipeline_counts: counts,
      total_applications: row.total_applications,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/jobs/:id/public
 * Public view of job details (title, description) for the application form.
 */
async function getPublicJobInfo(req, res, next) {
  try {
    const jobId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(jobId) || jobId < 1) {
      throw new AppError(400, 'Invalid job id.');
    }

    const result = await pool.query(
      `SELECT id, title, description
       FROM jobs
       WHERE id = $1 AND status = 'open'`,
      [jobId]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Job not found or is no longer accepting applications.');
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/jobs/:id
 * Partial update: active_capacity and/or status (open | closed).
 */
async function updateJob(req, res, next) {
  try {
    const jobId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(jobId) || jobId < 1) {
      throw new AppError(400, 'Invalid job id.');
    }

    const { active_capacity, status } = req.body ?? {};
    const updates = [];
    const values = [];
    let p = 1;

    if (active_capacity !== undefined) {
      const cap = Number(active_capacity);
      if (!Number.isFinite(cap) || cap < 1 || !Number.isInteger(cap)) {
        throw new AppError(400, 'Field "active_capacity" must be a positive integer when provided.');
      }
      updates.push(`active_capacity = $${p++}`);
      values.push(cap);
    }

    if (status !== undefined) {
      if (typeof status !== 'string' || !JOB_STATUSES.has(status)) {
        throw new AppError(400, 'Field "status" must be "open" or "closed" when provided.');
      }
      updates.push(`status = $${p++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'Provide at least one of: active_capacity, status.');
    }

    values.push(jobId, req.companyId);

    const result = await pool.query(
      `UPDATE jobs
       SET ${updates.join(', ')}
       WHERE id = $${p++} AND company_id = $${p}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Job not found.');
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/jobs/:jobId/applications
 * Paginated applicants for a job (company must own the job).
 */
async function listJobApplications(req, res, next) {
  try {
    const jobId = Number.parseInt(req.params.jobId, 10);
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

    const rawLimit = Number.parseInt(String(req.query.limit ?? '200'), 10);
    const rawOffset = Number.parseInt(String(req.query.offset ?? '0'), 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 500) : 200;
    const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS c FROM applications WHERE job_id = $1`,
      [jobId]
    );

    const apps = await pool.query(
      `SELECT *
       FROM applications
       WHERE job_id = $1
       ORDER BY
         CASE status
           WHEN 'active' THEN 1
           WHEN 'ack_pending' THEN 2
           WHEN 'waitlisted' THEN 3
           ELSE 4
         END,
         waitlist_position ASC NULLS LAST,
         created_at ASC
       LIMIT $2 OFFSET $3`,
      [jobId, limit, offset]
    );

    res.json({
      job_id: jobId,
      applications: apps.rows,
      total: countRes.rows[0].c,
      limit,
      offset,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createJob,
  listJobs,
  getJobById,
  updateJob,
  listJobApplications,
  getPublicJobInfo,
};
