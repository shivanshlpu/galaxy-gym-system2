const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: errors.join(', '),
      code: 'VALIDATION_ERROR',
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      error: `Duplicate value for ${field}. This ${field} already exists.`,
      code: 'DUPLICATE_KEY',
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format.',
      code: 'INVALID_ID',
    });
  }

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File is too large. Maximum size is 5MB.',
        code: 'FILE_TOO_LARGE',
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
      code: 'UPLOAD_ERROR',
    });
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    const errors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({
      success: false,
      error: errors.join(', '),
      code: 'VALIDATION_ERROR',
    });
  }

  // Default error — hide internal details in production
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.statusCode || 500).json({
    success: false,
    error: isProduction ? 'Internal server error.' : (err.message || 'Internal server error.'),
    code: err.code || 'SERVER_ERROR',
  });
};

module.exports = errorHandler;
