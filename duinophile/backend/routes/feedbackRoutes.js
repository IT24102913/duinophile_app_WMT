const express = require('express');
const router  = express.Router();
const {
  createFeedback, getFeedbackByCourse, getAllFeedback,
  updateFeedback, deleteFeedback, approveFeedback,
} = require('../controllers/feedbackController');
const { protect, staffOrAdmin } = require('../middleware/authMiddleware');

router.post('/',                  protect, createFeedback);
router.get('/course/:courseId',   protect, getFeedbackByCourse);
router.get('/',                   protect, staffOrAdmin, getAllFeedback);
router.put('/:id',                protect, updateFeedback);
router.delete('/:id',             protect, deleteFeedback);
router.post('/:id/approve',       protect, staffOrAdmin, approveFeedback);

module.exports = router;
