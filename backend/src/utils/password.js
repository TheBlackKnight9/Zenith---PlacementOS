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

/**
 * Generates an 8-character random password containing letters, numbers, and signs.
 */
export function generateRandomPassword(length = 8) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const signs = '!@#$%&*';

  // Ensure at least one uppercase, one lowercase, one digit, and one sign
  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    signs[Math.floor(Math.random() * signs.length)],
  ];

  const allPool = upper + lower + digits + signs;
  const remainingCount = length - required.length;
  for (let i = 0; i < remainingCount; i++) {
    required.push(allPool[Math.floor(Math.random() * allPool.length)]);
  }

  // Shuffle using Fisher-Yates
  for (let i = required.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [required[i], required[j]] = [required[j], required[i]];
  }

  return required.join('');
}
