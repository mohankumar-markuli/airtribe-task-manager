const express = require('express');
const { addComment, getComments, deleteComment } = require('../controllers/commentController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true });

router.use(authenticateToken);

// 1. Nested under tasks: /:taskId/comments
router.post('/:taskId/comments', addComment);
router.get('/:taskId/comments', getComments);
router.delete('/:taskId/comments/:commentId', deleteComment);

// 2. Direct comment routes: /:taskId
router.post('/:taskId', addComment);
router.get('/:taskId', getComments);
router.delete('/:taskId/:commentId', deleteComment);

module.exports = router;
