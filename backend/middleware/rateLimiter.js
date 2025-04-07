const rateLimit = require('express-rate-limit');

/**
 * @desc Rate limiter to prevent brute-force on routes.
 * Limits: 5 attempts per 5 minutes per IP.
 */
const rateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === 'test' ? Infinity : 5, // limit each IP to 5 requests per window
  message: {
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
});

module.exports = { rateLimiter };
