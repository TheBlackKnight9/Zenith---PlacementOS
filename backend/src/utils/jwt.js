import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'placementos-super-secret-jwt-key-2026-production-ready';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Signs a new JWT token containing user identity and role
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifies a JWT token signature and returns decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
