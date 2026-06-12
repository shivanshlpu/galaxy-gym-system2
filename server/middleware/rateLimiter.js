const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for login/register — prevents brute force attacks.
 * Max 7 attempts per 15-minute window per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 7,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many attempts. Please try again after 15 minutes.',
    code: 'RATE_LIMITED',
  },
});

/**
 * General API rate limiter — prevents abuse of all endpoints.
 * Max 200 requests per minute per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
    code: 'RATE_LIMITED',
  },
});

module.exports = { authLimiter, apiLimiter };
