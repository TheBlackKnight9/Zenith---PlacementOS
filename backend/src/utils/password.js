import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt
 */
export async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compares a plaintext password against a stored bcrypt hash
 */
export async function comparePassword(plainPassword, passwordHash) {
  return await bcrypt.compare(plainPassword, passwordHash);
}
