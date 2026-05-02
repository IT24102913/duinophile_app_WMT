const Report = require('../models/Report');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');

// Helper to format responses
const sendResponse = (res, statusCode, data) => res.status(statusCode).json(data);
const sendError = (res, statusCode, message) => res.status(statusCode).json({ error: message });

// ── POST /api/reports ─────────────────────────────────────────────────────────
exports.createReport = async (req, res) => {
  try {
    const { commentId, reason } = req.body;

    if (!commentId || !reason) {
      return sendError(res, 400, 'Comment ID and reason are required.');
    }

    if (reason.trim().length < 5 || reason.trim().length > 500) {
      return sendError(res, 400, 'Reason must be between 5 and 500 characters.');
    }

    const comment = await Comment.findById(commentId).lean();
    if (!comment) return sendError(res, 404, 'Comment not found.');

    // Check for existing report to prevent duplicates
    const existingReport = await Report.findOne({ reporterId: req.user._id, commentId });
    if (existingReport) {
      return sendError(res, 409, 'You have already reported this comment.');
    }

    const report = await Report.create({
      reporterId: req.user._id,
      reporterName: req.user.username,
      commentId: comment._id,
      postId: comment.postId,
      commentContent: comment.content,
      commentAuthorName: comment.authorName || 'Scholar',
      reason: reason.trim(),
    });

    sendResponse(res, 201, { message: 'Comment reported successfully.', report });
  } catch (err) {
    console.error('[createReport Error]:', err);
    sendError(res, 500, 'Failed to create report. Please try again later.');
  }
};

// ── GET /api/reports ── (Staff/Admin: pending reports) ───────────────────────
exports.getPendingReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const reports = await Report.find({ status: 'PENDING' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Report.countDocuments({ status: 'PENDING' });

    sendResponse(res, 200, {
      reports,
      pagination: { total, page, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('[getPendingReports Error]:', err);
    sendError(res, 500, 'Failed to fetch pending reports.');
  }
};

// ── PUT /api/reports/:id/resolve ─────────────────────────────────────────────
exports.resolveReport = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { action } = req.body; // 'ACCEPT' or 'REJECT'
    if (!['ACCEPT', 'REJECT'].includes(action)) {
      return sendError(res, 400, 'Invalid action. Must be ACCEPT or REJECT.');
    }

    const report = await Report.findById(req.params.id).session(session);
    if (!report) {
      await session.abortTransaction();
      return sendError(res, 404, 'Report not found.');
    }

    if (report.status !== 'PENDING') {
      await session.abortTransaction();
      return sendError(res, 400, 'This report has already been resolved.');
    }

    if (action === 'ACCEPT') {
      await Comment.findByIdAndDelete(report.commentId).session(session);
      report.status = 'ACCEPTED';
      await report.save({ session });
      await session.commitTransaction();
      return sendResponse(res, 200, { message: 'Report accepted and comment deleted.', report });
    } else {
      report.status = 'REJECTED';
      await report.save({ session });
      await session.commitTransaction();
      return sendResponse(res, 200, { message: 'Report rejected.', report });
    }
  } catch (err) {
    await session.abortTransaction();
    console.error('[resolveReport Error]:', err);
    sendError(res, 500, 'Failed to resolve report.');
  } finally {
    session.endSession();
  }
};

// ── PUT /api/reports/:id ───────────────────────────────────────────────────────
exports.updateMyReport = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim().length < 5 || reason.trim().length > 500) {
      return sendError(res, 400, 'Reason must be between 5 and 500 characters.');
    }

    const report = await Report.findOne({ _id: req.params.id, reporterId: req.user._id });
    if (!report) {
      return sendError(res, 404, 'Report not found or not authorized.');
    }

    if (report.status !== 'PENDING') {
      return sendError(res, 400, 'Cannot edit a resolved report.');
    }

    report.reason = reason.trim();
    await report.save();
    sendResponse(res, 200, { message: 'Report updated successfully.', report });
  } catch (err) {
    console.error('[updateMyReport Error]:', err);
    sendError(res, 500, 'Failed to update report.');
  }
};

// ── DELETE /api/reports/:id ───────────────────────────────────────────────────
exports.deleteMyReport = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, reporterId: req.user._id });
    if (!report) {
      return sendError(res, 404, 'Report not found or not authorized.');
    }

    if (report.status !== 'PENDING') {
      return sendError(res, 400, 'Cannot delete a resolved report.');
    }

    await report.deleteOne();
    sendResponse(res, 200, { message: 'Report deleted successfully.' });
  } catch (err) {
    console.error('[deleteMyReport Error]:', err);
    sendError(res, 500, 'Failed to delete report.');
  }
};

// ── GET /api/reports/my ───────────────────────────────────────────────────────
exports.getMyReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const reports = await Report.find({ reporterId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Report.countDocuments({ reporterId: req.user._id });

    sendResponse(res, 200, {
      reports,
      pagination: { total, page, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('[getMyReports Error]:', err);
    sendError(res, 500, 'Failed to fetch your reports.');
  }
};
