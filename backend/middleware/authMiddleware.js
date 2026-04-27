const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT and attach user to req.user
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authorized. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Must be ADMIN
exports.adminOnly = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Must be STAFF or ADMIN
exports.staffOrAdmin = (req, res, next) => {
  if (!['ADMIN', 'STAFF'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Staff or Admin only.' });
  }
  next();
};
