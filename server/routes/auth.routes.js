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

// Public: Anyone can register an admin account (or consider adding a setup flag if you only want 1 admin)
router.post('/register', authLimiter, register);

router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);
router.put('/change-password', verifyToken, changePassword);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
