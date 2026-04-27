const Post = require('../models/Post');
const path = require('path');
const fs   = require('fs');

// ── GET /api/posts ──
exports.getPosts = async (req, res) => {
  try {
    const allPosts = await Post.find().sort({ createdAt: -1 });

    // ADMIN / STAFF see everything; users see approved posts or their own
    if (req.user && ['ADMIN', 'STAFF'].includes(req.user.role)) {
      return res.json(allPosts);
    }

    const userId = req.user ? String(req.user._id) : null;
    const filtered = allPosts.filter(
      (p) => p.status === 'APPROVED' || (userId && String(p.authorId) === userId)
    );
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/posts ───
exports.createPost = async (req, res) => {
  try {
    const { content, achievementType } = req.body;

    // Anti-spam: block exact duplicate content from same user
    const recentPosts = await Post.find({ authorId: req.user._id }).sort({ createdAt: -1 }).limit(1);
    if (recentPosts.length > 0 && recentPosts[0].content === content) {
      return res.status(400).json({ error: 'Spam protection: You just posted this exact content.' });
    }

    const post = await Post.create({
      content,
      achievementType,
      authorId:   req.user._id,
      authorName: req.user.username,
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── GET /api/posts/:id ───
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PUT /api/posts/:id ────
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    // Only author, staff, or admin may edit
    const isOwner = String(post.authorId) === String(req.user._id);
    if (!isOwner && !['ADMIN', 'STAFF'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    post.content = req.body.content || post.content;
    post.achievementType = req.body.achievementType || post.achievementType;
    post.status = 'PENDING'; // back to pending after edit

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── DELETE /api/posts/:id ──
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const isOwner = String(post.authorId) === String(req.user._id);
    if (!isOwner && !['ADMIN', 'STAFF'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    // Delete image file if exists
    if (post.imageUrl) {
      const filePath = path.join(__dirname, '..', post.imageUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/posts/:id/approve ───
exports.approvePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { status: 'APPROVED' },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json({ message: 'Post approved.', post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/posts/:id/decline ──
exports.declinePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { status: 'DECLINED' },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json({ message: 'Post declined.', post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/posts/:id/react ──
exports.reactToPost = async (req, res) => {
  try {
    const { type } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const userId = String(req.user._id);
    const reactions = post.reactions || new Map();

    // Remove user from any existing reaction type
    let alreadyHasThis = false;
    for (const [key, users] of reactions) {
      const idx = users.indexOf(userId);
      if (idx !== -1) {
        if (key === type) alreadyHasThis = true;
        users.splice(idx, 1);
        reactions.set(key, users);
      }
    }

    // Toggle: if they didn't already have this reaction, add it
    if (!alreadyHasThis) {
      const existing = reactions.get(type) || [];
      existing.push(userId);
      reactions.set(type, existing);
    }

    post.reactions = reactions;
    await post.save();
    res.json({ message: 'Reaction updated.', reactions: Object.fromEntries(post.reactions) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/posts/:id/upload-image ──
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedImageTypes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Only JPEG, PNG, and WebP images are allowed.' });
    }
    if (req.file.size > 2 * 1024 * 1024) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Image must be under 2MB.' });
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { imageUrl: `/uploads/${req.file.filename}` },
      { new: true }
    );

    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json({ imageUrl: post.imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/posts/user/:userId ─
exports.getPostsByUser = async (req, res) => {
  try {
    const posts = await Post.find({ authorId: req.params.userId }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
