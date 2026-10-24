const express = require('express');
const upload = require('../middlewares/upload');
const {
  uploadAttachment,
  listAttachments,
  getAttachment,
  deleteAttachment,
} = require('../controllers/attachmentController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true });

router.use(authenticateToken);

// 1. Nested under tasks: /:taskId/attachments
router.post('/:taskId/attachments', upload.single('file'), uploadAttachment);
router.get('/:taskId/attachments', listAttachments);
router.get('/:taskId/attachments/:attachmentId', getAttachment);
router.delete('/:taskId/attachments/:attachmentId', deleteAttachment);

// 2. Direct attachment routes: /:taskId
router.post('/:taskId', upload.single('file'), uploadAttachment);
router.get('/:taskId', listAttachments);
router.get('/:taskId/:attachmentId', getAttachment);
router.delete('/:taskId/:attachmentId', deleteAttachment);

module.exports = router;
