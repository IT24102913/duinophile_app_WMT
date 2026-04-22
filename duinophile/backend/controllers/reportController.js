const Report  = require('../models/Report');
const Comment = require('../models/Comment');

// ── POST /api/reports ─────────────────────────────────────────────────────────
exports.createReport = async (req, res) => {
  try {
    const { commentId, reason } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    const report = await Report.create({
      reporterId:        req.user._id,
      reporterName:      req.user.username,
      commentId:         comment._id,
      postId:            comment.postId,
      commentContent:    comment.content,
      commentAuthorName: comment.authorName || 'Scholar',
      reason,
    });

    res.status(201).json({ message: 'Comment reported successfully.', report });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── GET /api/reports ── (Staff/Admin: pending reports) ───────────────────────
exports.getPendingReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: 'PENDING' }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PUT /api/reports/:id/resolve ─────────────────────────────────────────────
exports.resolveReport = async (req, res) => {
  try {
    const { action } = req.body; // 'ACCEPT' or 'REJECT'
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    if (action === 'ACCEPT') {
      await Comment.findByIdAndDelete(report.commentId);
      report.status = 'ACCEPTED';
      await report.save();
      return res.json({ message: 'Report accepted and comment deleted.' });
    } else if (action === 'REJECT') {
      report.status = 'REJECTED';
      await report.save();
      return res.json({ message: 'Report rejected.' });
    }

    res.status(400).json({ error: 'Action must be ACCEPT or REJECT.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PUT /api/reports/:id ───────────────────────────────────────────────────────
exports.updateMyReport = async (req, res) => {
  try {
    const { reason } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    // Check ownership
    if (report.reporterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this report.' });
    }

    report.reason = reason;
    await report.save();
    res.json({ message: 'Report updated successfully.', report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE /api/reports/:id ───────────────────────────────────────────────────
exports.deleteMyReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    // Check ownership
    if (report.reporterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this report.' });
    }

    await report.deleteOne();
    res.json({ message: 'Report deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/reports/my ───────────────────────────────────────────────────────
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.user._id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
