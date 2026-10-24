
const express = require('express');

const {
    register,
    login,
    getMe,
    updateProfile,
    logout,
} = require('../controllers/authController');

const {
    authenticateToken,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateProfile);
router.patch('/me', authenticateToken, updateProfile);
router.post('/logout', authenticateToken, logout);

module.exports = router;
