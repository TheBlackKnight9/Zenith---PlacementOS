/**
 * Standardized API Response Utilities
 * Matches the JSON envelopes defined in API_SPECIFICATION.md
 */

export function sendSuccess(res, statusCode = 200, message = 'Success', data = null) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null
  });
}

export function sendError(res, statusCode = 500, message = 'An error occurred', error = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: error ? {
      code: error.code || 'ERROR',
      details: error.details || error.message || error
    } : null
  });
}
