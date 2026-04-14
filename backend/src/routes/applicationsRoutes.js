/**
 * Routes: /api/applications
 * Public applicant actions first; company routes use JWT (Authorization: Bearer).
 */
const express = require('express');
const applicationsController = require('../controllers/applicationsController');
const auditController = require('../controllers/auditController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.get('/:id/status', applicationsController.getPublicStatus);
router.post('/:id/withdraw', applicationsController.withdrawApplication);
router.post('/:id/acknowledge', applicationsController.acknowledgeApplication);
router.get('/:id/audit', requireAuth, auditController.getApplicationAudit);
router.patch('/:id/status', requireAuth, applicationsController.patchApplicationStatus);

module.exports = router;
