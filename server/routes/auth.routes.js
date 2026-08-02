const express = require('express');
const router = express.Router();
const { verifyToken, optionalVerifyToken } = require('../middleware/auth.middleware');
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

// Registration: Accepts initial admin setup when 0 users exist; enforces token verification if users exist
router.post('/register', authLimiter, optionalVerifyToken, register);

router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);
router.put('/change-password', verifyToken, changePassword);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
