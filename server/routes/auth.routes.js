const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  login,
  register,
  logout,
  getMe,
  changePassword,
  updateProfile,
} = require('../controllers/auth.controller');

// Rate-limited public routes
router.post('/login', authLimiter, login);

// Protected: only authenticated admins can create new accounts
router.post('/register', authLimiter, verifyToken, register);

router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);
router.put('/change-password', verifyToken, changePassword);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
