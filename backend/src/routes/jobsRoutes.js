/**
 * Routes: /api/jobs
 *
 * Public routes (apply) must be registered before JWT middleware.
 */
const express = require('express');
const jobsController = require('../controllers/jobsController');
const applicationsController = require('../controllers/applicationsController');
const auditController = require('../controllers/auditController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

// Applicant submit — no auth; locks job row in DB transaction
router.post('/:jobId/apply', applicationsController.applyToJob);
router.get('/:id/public', jobsController.getPublicJobInfo);

router.use(requireAuth);

router.post('/', jobsController.createJob);
router.get('/', jobsController.listJobs);
router.get('/:jobId/applications', jobsController.listJobApplications);
router.get('/:id/audit', auditController.getJobAudit);
router.get('/:id', jobsController.getJobById);
router.patch('/:id', jobsController.updateJob);

module.exports = router;
