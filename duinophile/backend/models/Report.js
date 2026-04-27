const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reporterName: {
      type: String,
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    commentContent: {
      type: String,
    },
    commentAuthorName: {
      type: String,
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
