/**
 * Application lifecycle: apply (job-scoped route), withdraw, acknowledge, company status updates.
 */
const { pool } = require('../db/pool');
const {
  submitApplication,
  exitApplication,
  acknowledgePromotion,
} = require('../services/pipelineEngine');
const { AppError } = require('../middleware/errorHandler');

/**
 * Ensures the application exists and belongs to the given company (via jobs.company_id).
 * @returns {Promise<{ job_id: number }>}
 */
async function assertApplicationForCompany(applicationId, companyId) {
  const result = await pool.query(
    `SELECT a.id, a.job_id, j.company_id
     FROM applications AS a
     INNER JOIN jobs AS j ON j.id = a.job_id
     WHERE a.id = $1`,
    [applicationId]
  );
  if (result.rows.length === 0) {
    throw new AppError(404, 'Application not found.');
  }
  const row = result.rows[0];
  if (row.company_id !== companyId) {
    throw new AppError(403, 'You do not have access to this application.');
  }
  return { job_id: row.job_id };
}

/**
 * GET /api/applications/:id/status
 * Public — no auth. Status, queue position, ack window metadata for the applicant link in emails.
 */
async function getPublicStatus(req, res, next) {
  try {
    const applicationId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(applicationId) || applicationId < 1) {
      throw new AppError(400, 'Invalid application id.');
    }

    const result = await pool.query(
      `SELECT a.id,
              a.status,
              a.waitlist_position,
              a.ack_deadline,
              a.applicant_name,
              j.id AS job_id,
              j.title AS job_title
       FROM applications AS a
       INNER JOIN jobs AS j ON j.id = a.job_id
       WHERE a.id = $1`,
      [applicationId]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Application not found.');
    }

    const row = result.rows[0];
    res.json({
      application_id: row.id,
      job_id: row.job_id,
      job_title: row.job_title,
      applicant_name: row.applicant_name,
      status: row.status,
      waitlist_position: row.waitlist_position,
      ack_deadline: row.ack_deadline,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/jobs/:jobId/apply
 * Body: { applicant_name, applicant_email }
 */
async function applyToJob(req, res, next) {
  try {
    const jobId = Number.parseInt(req.params.jobId, 10);
    if (!Number.isFinite(jobId) || jobId < 1) {
      throw new AppError(400, 'Invalid job id.');
    }

    const application = await submitApplication(jobId, req.body ?? {});
    res.status(201).json({ application });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/applications/:id/status
 * Body: { status: "rejected" | "hired" }
 * Auth: Bearer JWT (company)
 */
async function patchApplicationStatus(req, res, next) {
  try {
    const applicationId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(applicationId) || applicationId < 1) {
      throw new AppError(400, 'Invalid application id.');
    }

    const status = req.body?.status;
    if (status !== 'rejected' && status !== 'hired') {
      throw new AppError(400, 'Body "status" must be "rejected" or "hired".');
    }

    await assertApplicationForCompany(applicationId, req.companyId);

    const application = await exitApplication(applicationId, status, { triggeredBy: 'user' });
    res.json({ application });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/applications/:id/withdraw
 * Body: { applicant_email } — must match the application (lightweight verification without JWT).
 */
async function withdrawApplication(req, res, next) {
  try {
    const applicationId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(applicationId) || applicationId < 1) {
      throw new AppError(400, 'Invalid application id.');
    }

    const email =
      typeof req.body?.applicant_email === 'string'
        ? req.body.applicant_email.trim().toLowerCase()
        : '';
    if (!email) {
      throw new AppError(400, 'Field "applicant_email" is required.');
    }

    const appRes = await pool.query(
      `SELECT id, applicant_email FROM applications WHERE id = $1`,
      [applicationId]
    );
    if (appRes.rows.length === 0) {
      throw new AppError(404, 'Application not found.');
    }
    if (appRes.rows[0].applicant_email.trim().toLowerCase() !== email) {
      throw new AppError(403, 'Email does not match this application.');
    }

    const application = await exitApplication(applicationId, 'withdrawn', { triggeredBy: 'user' });
    res.json({ application });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/applications/:id/acknowledge
 * Body: { applicant_email }
 * Moves ack_pending → active (see pipeline engine).
 */
async function acknowledgeApplication(req, res, next) {
  try {
    const applicationId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(applicationId) || applicationId < 1) {
      throw new AppError(400, 'Invalid application id.');
    }

    const application = await acknowledgePromotion(applicationId, req.body ?? {});
    res.json({ application });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPublicStatus,
  applyToJob,
  patchApplicationStatus,
  withdrawApplication,
  acknowledgeApplication,
};
