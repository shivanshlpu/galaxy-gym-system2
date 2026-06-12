const multer = require('multer');

// Store in memory for processing with sharp before upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // First check: MIME type must be an image
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false);
  }

  // Only allow specific safe image formats
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Allowed formats: JPEG, PNG, WebP, GIF'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1, // Only 1 file per request
  },
});

/**
 * Middleware to verify uploaded file is actually an image by checking magic bytes.
 * MIME type can be spoofed by the client; magic bytes cannot.
 * Must be used AFTER multer processes the upload.
 */
const verifyImageMagicBytes = (req, res, next) => {
  if (!req.file) return next();

  const buffer = req.file.buffer;
  if (!buffer || buffer.length < 4) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file: too small to be an image.',
      code: 'INVALID_FILE',
    });
  }

  // Check magic bytes for common image formats
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
  const isWebp = buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

  if (!isJpeg && !isPng && !isGif && !isWebp) {
    return res.status(400).json({
      success: false,
      error: 'File content does not match a valid image format.',
      code: 'INVALID_IMAGE',
    });
  }

  next();
};

module.exports = upload;
module.exports.verifyImageMagicBytes = verifyImageMagicBytes;
