const express = require('express');
const router  = express.Router();
const {
  getPosts, createPost, getPostById, updatePost,
  deletePost, approvePost, declinePost, reactToPost, uploadImage, getPostsByUser,
} = require('../controllers/postController');
const { protect, staffOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/user/:userId',      protect, getPostsByUser);
router.get('/',                  protect, getPosts);
router.post('/',                 protect, createPost);
router.get('/:id',               protect, getPostById);
router.put('/:id',               protect, updatePost);
router.delete('/:id',            protect, deletePost);
router.post('/:id/approve',      protect, staffOrAdmin, approvePost);
router.post('/:id/decline',      protect, staffOrAdmin, declinePost);
router.post('/:id/react',        protect, reactToPost);
router.post('/:id/upload-image', protect, upload.single('image'), uploadImage);

module.exports = router;
