const express = require('express');
const { generateTaskDescription } = require('../controllers/aiController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.post('/tasks/generate', generateTaskDescription);
router.post('/generate-description', generateTaskDescription);
router.post('/generate', generateTaskDescription);

module.exports = router;
