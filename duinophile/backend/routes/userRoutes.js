const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, updateUser, deleteUser, updateMyProfile } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Protected route for logged-in users to update their own profile
router.put('/me', protect, updateMyProfile);

// Remaining routes require the user to be logged in and have the ADMIN role
router.use(protect, adminOnly);

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
