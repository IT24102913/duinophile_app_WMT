const Comment = require('../models/Comment');

// ── GET /api/comments/:postId ─────────────────────────────────────────────────
exports.getCommentsByPost = async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/comments ────────────────────────────────────────────────────────
exports.createComment = async (req, res) => {
  try {
    const { content, postId, parentCommentId } = req.body;

    const postComments = await Comment.find({ postId });

    // Limit: max 3 comments per user per post (could be adjusted if we want unlimited replies, but leaving for consistency)
    const userCommentCount = postComments.filter(
      (c) => String(c.authorId) === String(req.user._id)
    ).length;

    if (userCommentCount >= 3) {
      return res.status(400).json({
        error: 'Comment limit reached: You can only post 3 comments per discussion thread.',
      });
    }

    // Anti-spam: no identical consecutive comment
    const lastUserComment = postComments
      .filter((c) => String(c.authorId) === String(req.user._id))
      .pop();
    if (lastUserComment && lastUserComment.content === content) {
      return res.status(400).json({ error: 'Spam protection: You just posted this exact comment.' });
    }

    const comment = await Comment.create({
      content,
      postId,
      parentCommentId: parentCommentId || null,
      authorId:   req.user._id,
      authorName: req.user.username,
    });

    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── PUT /api/comments/:id ─────────────────────────────────────────────────────
exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    if (String(comment.authorId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to edit this comment.' });
    }

    comment.content = req.body.content || comment.content;
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── DELETE /api/comments/:id ──────────────────────────────────────────────────
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    const isOwner = String(comment.authorId) === String(req.user._id);
    const isPrivileged = ['ADMIN', 'STAFF'].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ error: 'Not authorized to delete this comment.' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
