/**
 * Mock Notification Service
 * In a production environment, this would integrate with an ESP like SendGrid or Brevo.
 */

const { pool } = require('../db/pool');

/**
 * Sends a promotion alert to an applicant.
 * @param {Object} applicant - The applicant record
 * @param {Object} job - The job record
 */
async function sendPromotionAlert(applicant, job) {
  const deadline = new Date(applicant.ack_deadline).toLocaleString();
  
  console.log('----------------------------------------------------');
  console.log(`[OUTBOUND EMAIL] To: ${applicant.applicant_email}`);
  console.log(`[OUTBOUND EMAIL] Subject: Action Required: You've been promoted for ${job.title}`);
  console.log(`[OUTBOUND EMAIL] Body: 
    Dear ${applicant.applicant_name},
    
    Great news! You have been moved to the active review stage for the position: ${job.title}.
    
    To secure your spot in the pipeline, please acknowledge this promotion by:
    ${deadline}
    
    You can view your current status and acknowledge here:
    ${process.env.FRONTEND_URL || 'http://localhost:5173'}/status?id=${applicant.id}
    
    If you do not acknowledge by the deadline, you will automatically be moved back to the waitlist.
  `);
  console.log('----------------------------------------------------');

  // Optional: Record in an audit table or a dedicated notifications table
  await pool.query(
    `INSERT INTO audit_log (job_id, application_id, to_status, reason, triggered_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      job.id,
      applicant.id,
      'notification_sent',
      `Promotion alert for ${job.title} sent to ${applicant.applicant_email}`,
      'system'
    ]
  );
}

module.exports = {
  sendPromotionAlert
};
