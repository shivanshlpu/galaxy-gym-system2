const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.',
      code: 'NO_TOKEN',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Auto-refresh: if token expires in less than 1 day, issue a new one
    const tokenExp = decoded.exp * 1000; // Convert to milliseconds
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (tokenExp - Date.now() < oneDayMs) {
      const newToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      res.setHeader('X-New-Token', newToken);
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid token.',
      code: 'INVALID_TOKEN',
    });
  }
};

module.exports = { verifyToken };
