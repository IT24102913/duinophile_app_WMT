const express  = require('express');
const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const cors     = require('cors');
const path     = require('path');

dotenv.config();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/courses',  require('./routes/courseRoutes'));
app.use('/api/lessons',  require('./routes/lessonRoutes'));
app.use('/api/posts',    require('./routes/postRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/reports',  require('./routes/reportRoutes'));
app.use('/api/users',    require('./routes/userRoutes'));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🚀 Duinophile API is running!', status: 'OK' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

// ── 404 Not Found ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Connect to MongoDB & Start Server ─────────────────────────────────────────
const connectDB = require('./config/db');
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Duinophile API server running on port ${PORT}`);
  });
});
