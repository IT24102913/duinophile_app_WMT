const express = require('express');
const router  = express.Router();
const {
  createReport, getPendingReports, resolveReport, getMyReports, updateMyReport, deleteMyReport
} = require('../controllers/reportController');
const { protect, staffOrAdmin } = require('../middleware/authMiddleware');

router.post('/',            protect, createReport);
router.get('/my',           protect, getMyReports);
router.get('/',             protect, staffOrAdmin, getPendingReports);
router.put('/:id/resolve',  protect, staffOrAdmin, resolveReport);
router.put('/:id',          protect, updateMyReport);
router.delete('/:id',       protect, deleteMyReport);

module.exports = router;
