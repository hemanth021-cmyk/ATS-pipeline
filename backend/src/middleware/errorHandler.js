/**
 * Central Express error handler.
 * Controllers call `next(err)` with AppError or generic Error instances.
 */

class AppError extends Error {
  /**
   * @param {number} statusCode HTTP status
   * @param {string} message User-safe message
   * @param {object} [extra] Optional JSON payload merged into the response body
   */
  constructor(statusCode, message, extra = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.extra = extra;
  }
}

/**
 * Express 4 error-handling middleware (4 arguments).
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    err instanceof AppError
      ? err.statusCode
      : typeof err.statusCode === 'number' && err.statusCode >= 400
        ? err.statusCode
        : 500;

  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  const body = { error: message };
  if (err instanceof AppError && err.extra) {
    Object.assign(body, err.extra);
  }

  if (statusCode === 500) {
    console.error('[error]', err);
  }

  res.status(statusCode).json(body);
}

module.exports = { AppError, errorHandler };
