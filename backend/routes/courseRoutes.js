const express = require('express');
const router  = express.Router();
const {
  getAllCourses, createCourse, getMyCourses, getCourseById,
  updateCourse, deleteCourse, enrollInCourse, getCourseDetails, searchCourses,
} = require('../controllers/courseController');
const { protect, staffOrAdmin, adminOnly } = require('../middleware/authMiddleware');

router.get('/search',      searchCourses);
router.get('/my',          protect, getMyCourses);
router.get('/',            getAllCourses);
router.post('/',           protect, staffOrAdmin, createCourse);
router.get('/:id/details', protect, getCourseDetails);
router.get('/:id',         getCourseById);
router.put('/:id',         protect, staffOrAdmin, updateCourse);
router.delete('/:id',      protect, staffOrAdmin, deleteCourse);
router.post('/:id/enroll', protect, enrollInCourse);

module.exports = router;
