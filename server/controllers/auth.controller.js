const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ActivityLog = require('../models/ActivityLog.model');

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email/username and password.',
        code: 'MISSING_CREDENTIALS',
      });
    }

    // Find user by email or username, explicitly select password
    const query = email ? { email: email.toLowerCase() } : { username };
    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Log activity
    await ActivityLog.create({
      action: 'admin_login',
      entityType: 'User',
      entityId: user._id,
      performedBy: user._id,
      details: { email: user.email },
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          gymName: user.gymName,
        },
      },
      message: 'Login successful.',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/logout
const logout = async (req, res) => {
  // JWT is stateless — client simply removes the token
  res.json({
    success: true,
    message: 'Logout successful.',
  });
};

// GET /api/v1/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
        code: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide current and new passwords.',
        code: 'MISSING_FIELDS',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters.',
        code: 'WEAK_PASSWORD',
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect.',
        code: 'INVALID_PASSWORD',
      });
    }

    user.password = newPassword;
    await user.save(); // Pre-save hook will hash

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, logout, getMe, changePassword };
