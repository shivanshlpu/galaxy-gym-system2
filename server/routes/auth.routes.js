const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  login,
  logout,
  getMe,
  changePassword,
} = require('../controllers/auth.controller');

router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);
router.put('/change-password', verifyToken, changePassword);

module.exports = router;
