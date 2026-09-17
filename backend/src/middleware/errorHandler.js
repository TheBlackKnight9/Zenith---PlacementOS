import { sendError } from '../utils/apiResponse.js';

/**
 * Centralized Express Global Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // Prisma unique constraint violation (e.g. email or roll number conflict)
  if (err.code === 'P2002') {
    const targets = err.meta?.target || ['field'];
    return sendError(res, 409, `A record with this ${targets.join(', ')} already exists.`, {
      code: 'DUPLICATE_ENTRY',
      details: err.meta
    });
  }

  // Database Check constraint violation
  if (err.code === '23514' || (err.message && err.message.includes('check constraint'))) {
    return sendError(res, 400, 'Invalid data violates database integrity check.', {
      code: 'CHECK_CONSTRAINT_VIOLATION',
      details: err.message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid authentication token.', { code: 'INVALID_TOKEN' });
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Authentication token has expired. Please log in again.', { code: 'TOKEN_EXPIRED' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, statusCode, message, {
    code: err.code || 'SERVER_ERROR',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
