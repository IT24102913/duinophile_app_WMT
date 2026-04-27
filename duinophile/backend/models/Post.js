const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
        content: {
      type: String,
      required: [true, 'Post content is required'],
      minlength: [10, 'Post must be at least 10 characters'],
      maxlength: [3000, 'Post cannot exceed 3000 characters'],
    },
    achievementType: {
      type: String,
      required: [true, 'Achievement type is required'],
    },
    imageUrl: {
      type: String,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    authorName: {
      type: String,
    },
    // reactions: { 'like': ['userId1', 'userId2'], 'fire': [...] }
    reactions: {
      type: Map,
      of: [String],
      default: {},
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'DECLINED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

// TTL: auto-delete posts after 60 days
postSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

module.exports = mongoose.model('Post', postSchema);
