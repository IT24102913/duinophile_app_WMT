const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const User   = require('../models/User');

// ── GET /api/courses ─────────────────────────────────────────────────────────
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/courses ────────────────────────────────────────────────────────
exports.createCourse = async (req, res) => {
  try {
    const { title, description, level, minimumPointsRequired } = req.body;

    const existing = await Course.findOne({ title: { $regex: `^${title}$`, $options: 'i' } });
    if (existing) {
      return res.status(400).json({ error: 'A course with this title already exists.' });
    }

    const course = await Course.create({
      title,
      description,
      level,
      minimumPointsRequired,
      creatorId: req.user._id,
    });

    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── GET /api/courses/my ──────────────────────────────────────────────────────
exports.getMyCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const courses = await Course.find({ _id: { $in: user.enrolledCourseIds } });

    // Add progress for each course
    const data = await Promise.all(
      courses.map(async (course) => {
        const lessons = await Lesson.find({ courseId: course._id });
        const completedCount = lessons.filter((l) =>
          user.completedLessonIds.map(String).includes(String(l._id))
        ).length;
        const progress = lessons.length > 0
          ? Math.round((completedCount / lessons.length) * 100)
          : 0;
        return { ...course.toObject(), progress };
      })
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/courses/:id ─────────────────────────────────────────────────────
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found.' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PUT /api/courses/:id ─────────────────────────────────────────────────────
exports.updateCourse = async (req, res) => {
  try {
    const { title, description, level, minimumPointsRequired } = req.body;

    // Check title uniqueness (excluding self)
    if (title) {
      const existing = await Course.findOne({
        title: { $regex: `^${title}$`, $options: 'i' },
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(400).json({ error: 'Another course with this title already exists.' });
      }
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { title, description, level, minimumPointsRequired },
      { new: true, runValidators: true }
    );

    if (!course) return res.status(404).json({ error: 'Course not found.' });
    res.json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── DELETE /api/courses/:id ──────────────────────────────────────────────────
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    // Also remove all lessons for this course
    await Lesson.deleteMany({ courseId: req.params.id });

    res.json({ message: 'Course and its lessons deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/courses/:id/enroll ─────────────────────────────────────────────
exports.enrollInCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    const user = await User.findById(req.user._id);

    if (user.points < course.minimumPointsRequired) {
      return res.status(403).json({
        error: `You need at least ${course.minimumPointsRequired} points to enroll. You have ${user.points}.`,
      });
    }

    if (user.enrolledCourseIds.map(String).includes(String(course._id))) {
      return res.status(400).json({ error: 'Already enrolled in this course.' });
    }

    user.enrolledCourseIds.push(course._id);
    await user.save();

    res.json({ message: 'Enrolled successfully.', courseId: course._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/courses/:id/details ─────────────────────────────────────────────
// Returns course + lessons + progress + enrollment status
exports.getCourseDetails = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    const lessons = await Lesson.find({ courseId: course._id }).select('-quiz');

    let isEnrolled = false;
    let completedLessonIds = [];
    let progress = 0;

    if (req.user) {
      const user = await User.findById(req.user._id);
      isEnrolled = user.enrolledCourseIds.map(String).includes(String(course._id));
      completedLessonIds = user.completedLessonIds.map(String);
      const completedCount = lessons.filter((l) =>
        completedLessonIds.includes(String(l._id))
      ).length;
      progress = lessons.length > 0
        ? Math.round((completedCount / lessons.length) * 100)
        : 0;
    }

    res.json({ course, lessons, isEnrolled, completedLessonIds, progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/courses/search ──────────────────────────────────────────────────
exports.searchCourses = async (req, res) => {
  try {
    const { query } = req.query;
    const courses = await Course.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
