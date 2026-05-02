const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
      match: [/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    fullName: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['USER', 'STAFF', 'ADMIN'],
      default: 'USER',
    },
    points: {
      type: Number,
      default: 0,
    },
    enrolledCourseIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    ],
    completedLessonIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    ],
    completedQuizLessonIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
