const express = require('express');
const router = express.Router();
const {
  createReport,
  getPendingReports,
  resolveReport,
  getMyReports,
  updateMyReport,
  deleteMyReport
} = require('../controllers/reportController');
const { protect, staffOrAdmin } = require('../middleware/authMiddleware');

// ── User Routes ──────────────────────────────────────────────────────────────
router.route('/')
  .post(protect, createReport);       // Create a new report

router.route('/my')
  .get(protect, getMyReports);        // Get current user's reports

router.route('/:id')
  .put(protect, updateMyReport)       // Update a specific report (if pending)
  .delete(protect, deleteMyReport);   // Delete a specific report (if pending)

// ── Staff/Admin Routes ───────────────────────────────────────────────────────
router.route('/')
  .get(protect, staffOrAdmin, getPendingReports); // Get all pending reports (paginated)

router.route('/:id/resolve')
  .put(protect, staffOrAdmin, resolveReport);     // Accept or reject a report

module.exports = router;
