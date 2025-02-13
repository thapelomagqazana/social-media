import rateLimit from "express-rate-limit";

// Check if running in test mode
const isTestEnv = process.env.NODE_ENV === "test";

/**
 * @function postRateLimiter
 * @description Limits the number of posts a user can create to prevent spam.
 */
export const postRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isTestEnv ? 25 : 10, // Limit each user to 10 posts per hour
  message: { message: "Too many posts created. Try again later." },
  headers: true,
});

// Rate limiting middleware (Tracks by IP)
export const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: isTestEnv ? 20 : 5, // Higher limit in tests
  standardHeaders: true, // Return rate limit headers
  legacyHeaders: false,
  keyGenerator: (req) => req.ip, // Tracks failed attempts by IP
  handler: (req, res) => {
    return res.status(429).json({ message: "Too many login attempts. Please try again later." });
  },
});
