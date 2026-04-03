const Feedback = require('../models/Feedback');

// ── POST /api/feedback ────────────────────────────────────────────────────────
exports.createFeedback = async (req, res) => {
  try {
    const { content, rating, courseId } = req.body;

    // Spam guard: 1 feedback per course per hour per user
    const recentFeedback = await Feedback.findOne({
      courseId,
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    if (recentFeedback) {
      const diffMinutes = (Date.now() - recentFeedback.createdAt.getTime()) / 60000;
      if (diffMinutes < 60) {
        return res.status(400).json({
          error: 'Spam protection: You can only submit feedback for a course once per hour.',
        });
      }
    }

    const feedback = await Feedback.create({
      content,
      rating,
      courseId,
      userId:   req.user._id,
      username: req.user.username,
    });

    res.status(201).json({ message: 'Feedback submitted. Pending admin approval.', feedback });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── GET /api/feedback/course/:courseId ───────────────────────────────────────
exports.getFeedbackByCourse = async (req, res) => {
  try {
    const allFeedback = await Feedback.find({ courseId: req.params.courseId }).sort({ createdAt: -1 });

    if (req.user && ['ADMIN', 'STAFF'].includes(req.user.role)) {
      return res.json(allFeedback);
    }

    const userId = req.user ? String(req.user._id) : null;
    const filtered = allFeedback.filter(
      (fb) => fb.status === 'APPROVED' || (userId && String(fb.userId) === userId)
    );
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/feedback ─────────────────────────────────────────────────────────
exports.getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).populate('courseId', 'title');
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PUT /api/feedback/:id ─────────────────────────────────────────────────────
exports.updateFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found.' });

    if (String(feedback.userId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    feedback.content = req.body.content || feedback.content;
    feedback.rating  = req.body.rating  || feedback.rating;
    feedback.status  = 'PENDING'; // reset to pending on edit
    await feedback.save();
    res.json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── DELETE /api/feedback/:id ──────────────────────────────────────────────────
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found.' });

    const isOwner = String(feedback.userId) === String(req.user._id);
    const isPrivileged = ['ADMIN', 'STAFF'].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    await feedback.deleteOne();
    res.json({ message: 'Feedback deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/feedback/:id/approve ───────────────────────────────────────────
exports.approveFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status: 'APPROVED' },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ error: 'Feedback not found.' });
    res.json({ message: 'Feedback approved.', feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
