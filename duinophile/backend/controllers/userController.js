const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ── GET /api/users ───────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/users ──────────────────────────────────────────────────────────
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required.' });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$/;
    if (password.length < 8 || !passwordRegex.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and include a digit, lowercase, uppercase, and special character.',
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role ? role : 'USER'; // Default to USER if not provided

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
      role: userRole,
    });

    res.status(201).json({
      message: 'User created successfully.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PUT /api/users/:id ───────────────────────────────────────────────────────
exports.updateUser = async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already exists.' });
      }
      user.username = username;
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered.' });
      }
      user.email = email.toLowerCase();
    }

    if (password) {
      const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$/;
      if (password.length < 8 || !passwordRegex.test(password)) {
        return res.status(400).json({
          error: 'Password must be at least 8 characters and include a digit, lowercase, uppercase, and special character.',
        });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (role) {
      if (!['USER', 'STAFF', 'ADMIN'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified.' });
      }
      user.role = role;
    }

    await user.save();

    res.json({
      message: 'User updated successfully.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE /api/users/:id ────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === userId) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PUT /api/users/me ────────────────────────────────────────────────────────
exports.updateMyProfile = async (req, res) => {
  try {
    const { username, email, fullName, password } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already exists.' });
      }
      user.username = username;
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered.' });
      }
      user.email = email.toLowerCase();
    }

    if (fullName !== undefined) user.fullName = fullName;

    if (password) {
      const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$/;
      if (password.length < 8 || !passwordRegex.test(password)) {
        return res.status(400).json({
          error: 'Password must be at least 8 characters and include a digit, lowercase, uppercase, and special character.',
        });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        points: user.points
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
