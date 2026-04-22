const express = require('express');
const router  = express.Router();
const {
  getCommentsByPost, createComment, updateComment, deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:postId',   protect, getCommentsByPost);
router.post('/',         protect, createComment);
router.put('/:id',       protect, updateComment);
router.delete('/:id',    protect, deleteComment);

module.exports = router;
