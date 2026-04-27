const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const User   = require('../models/User');
const path   = require('path');
const fs     = require('fs');

// ── GET /api/lessons/course/:courseId ────────────────────────────────────────
exports.getLessonsByCourse = async (req, res) => {
  try {
    const lessons = await Lesson.find({ courseId: req.params.courseId }).select('-quiz');
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/lessons/:id ─────────────────────────────────────────────────────
exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    let isEnrolled = false;
    let completedLessonIds = [];
    let completedQuizLessonIds = [];

    if (req.user) {
      const user = await User.findById(req.user._id);
      isEnrolled = user.enrolledCourseIds.map(String).includes(String(lesson.courseId));
      completedLessonIds = user.completedLessonIds.map(String);
      completedQuizLessonIds = user.completedQuizLessonIds.map(String);
    }

    res.json({ lesson, isEnrolled, completedLessonIds, completedQuizLessonIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/lessons ────────────────────────────────────────────────────────
exports.createLesson = async (req, res) => {
  try {
    const { title, content, courseId, quiz } = req.body;

    // Validate quiz if provided
    if (quiz) {
      let parsedQuiz = typeof quiz === 'string' ? JSON.parse(quiz) : quiz;
      for (const q of parsedQuiz) {
        const cleanOptions = (q.options || []).filter((o) => o && o.trim() !== '');
        if (cleanOptions.length < 2) {
          return res.status(400).json({ error: 'Each quiz question must have at least 2 non-blank options.' });
        }
      }
    }

    const lesson = await Lesson.create({ title, content, courseId, quiz: quiz ? (typeof quiz === 'string' ? JSON.parse(quiz) : quiz) : [] });

    // Add lesson reference to course
    await Course.findByIdAndUpdate(courseId, { $push: { lessonIds: lesson._id } });

    res.status(201).json(lesson);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── PUT /api/lessons/:id ─────────────────────────────────────────────────────
exports.updateLesson = async (req, res) => {
  try {
    const { title, content, quiz } = req.body;

    if (quiz) {
      let parsedQuiz = typeof quiz === 'string' ? JSON.parse(quiz) : quiz;
      for (const q of parsedQuiz) {
        const cleanOptions = (q.options || []).filter((o) => o && o.trim() !== '');
        if (cleanOptions.length < 2) {
          return res.status(400).json({ error: 'Each quiz question must have at least 2 non-blank options.' });
        }
      }
    }

    const updateData = { title, content };
    if (quiz !== undefined) {
      updateData.quiz = typeof quiz === 'string' ? JSON.parse(quiz) : quiz;
    }

    const lesson = await Lesson.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });
    res.json(lesson);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── DELETE /api/lessons/:id ──────────────────────────────────────────────────
exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    // Remove from course's lessonIds
    await Course.findByIdAndUpdate(lesson.courseId, { $pull: { lessonIds: lesson._id } });

    // Delete PDF file if exists
    if (lesson.materialUrl) {
      const filePath = path.join(__dirname, '..', lesson.materialUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ message: 'Lesson deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/lessons/:id/upload-pdf ────────────────────────────────────────
exports.uploadPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    if (req.file.mimetype !== 'application/pdf') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Only PDF files are allowed for lesson materials.' });
    }
    if (req.file.size > 20 * 1024 * 1024) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'PDF must be under 20MB.' });
    }

    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      {
        materialUrl: `/uploads/${req.file.filename}`,
        materialName: req.file.originalname,
      },
      { new: true }
    );

    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });
    res.json({ materialUrl: lesson.materialUrl, materialName: lesson.materialName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE /api/lessons/:id/material ────────────────────────────────────────
exports.deleteMaterial = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    if (lesson.materialUrl) {
      const filePath = path.join(__dirname, '..', lesson.materialUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    lesson.materialUrl = null;
    lesson.materialName = null;
    await lesson.save();

    res.json({ message: 'Material removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/lessons/:id/complete ──────────────────────────────────────────
exports.completeLesson = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const lessonId = req.params.id;

    if (!user.completedLessonIds.map(String).includes(lessonId)) {
      user.completedLessonIds.push(lessonId);
      await user.save();
    }

    res.json({ message: 'Lesson marked as complete.', completedLessonIds: user.completedLessonIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/lessons/:id/submit-quiz ────────────────────────────────────────
exports.submitQuiz = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const lessonId = req.params.id;
    const { earnedPoints } = req.body;

    if (user.completedQuizLessonIds.map(String).includes(lessonId)) {
      return res.status(400).json({ error: 'You have already submitted the quiz for this lesson.' });
    }

    user.points += Number(earnedPoints) || 0;
    user.completedQuizLessonIds.push(lessonId);
    if (!user.completedLessonIds.map(String).includes(lessonId)) {
      user.completedLessonIds.push(lessonId);
    }
    await user.save();

    res.json({
      message: 'Quiz submitted. Points awarded!',
      pointsEarned: earnedPoints,
      totalPoints: user.points,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
