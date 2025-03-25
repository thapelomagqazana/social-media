import jwt from "jsonwebtoken";

/**
 * @function generateToken
 * @description Creates a JWT token for the given user ID
 * @param {string} userId - MongoDB user ID
 * @returns {string} - Signed JWT token
 */
export const generateToken = (userId) => {
  return jwt.sign(
    {
      userId,
      iat: Math.floor(Date.now() / 1000), // issued at
      jti: crypto.randomUUID(), // unique ID for this token (optional)
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
};