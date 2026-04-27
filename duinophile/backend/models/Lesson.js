const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    minlength: [10, 'Question must be at least 10 characters'],
    maxlength: [500, 'Question cannot exceed 500 characters'],
  },
  content: {
    type: String,
    maxlength: [2000, 'Question content cannot exceed 2000 characters'],
  },
  options: {
    type: [String],
    validate: {
      validator: (arr) => arr.length >= 2,
      message: 'Each question must have at least 2 options',
    },
  },
  correctOptionIndex: {
    type: Number,
    required: true,
  },
  points: {
    type: Number,
    default: 10,
    min: [1, 'Points must be at least 1'],
    max: [100, 'Points cannot exceed 100'],
  },
});

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    content: {
      type: String,
      required: [true, 'Lesson content is required'],
      minlength: [20, 'Content must be at least 20 characters'],
      maxlength: [15000, 'Content cannot exceed 15000 characters'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    quiz: [quizQuestionSchema],
    materialUrl: {
      type: String,
    },
    materialName: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lesson', lessonSchema);
