const express = require('express');
const router  = express.Router();
const {
  getLessonsByCourse, getLessonById, createLesson, updateLesson,
  deleteLesson, uploadPdf, deleteMaterial, completeLesson, submitQuiz,
} = require('../controllers/lessonController');
const { protect, staffOrAdmin, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/course/:courseId',    getLessonsByCourse);
router.get('/:id',                 protect, getLessonById);
router.post('/',                   protect, staffOrAdmin, createLesson);
router.put('/:id',                 protect, staffOrAdmin, updateLesson);
router.delete('/:id',              protect, staffOrAdmin, deleteLesson);
router.post('/:id/upload-pdf',     protect, staffOrAdmin, upload.single('file'), uploadPdf);
router.delete('/:id/material',     protect, staffOrAdmin, deleteMaterial);
router.post('/:id/complete',       protect, completeLesson);
router.post('/:id/submit-quiz',    protect, submitQuiz);

module.exports = router;
