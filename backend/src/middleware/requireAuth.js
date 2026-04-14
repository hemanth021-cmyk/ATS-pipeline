/**
 * JWT bearer authentication for company-scoped routes.
 * Sets req.companyId and req.companyEmail from a verified token (issued at login/register).
 */
const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || String(secret).trim() === '') {
    return null;
  }
  return secret;
}

/**
 * Express middleware: requires `Authorization: Bearer <token>`.
 */
function requireAuth(req, res, next) {
  const secret = getJwtSecret();
  if (!secret) {
    return next(new AppError(500, 'JWT_SECRET is not configured.'));
  }

  const header = req.headers.authorization;
  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication required. Send Authorization: Bearer <token>.'));
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return next(new AppError(401, 'Authentication required.'));
  }

  try {
    const payload = jwt.verify(token, secret);
    const rawId = payload.companyId ?? payload.sub;
    const companyId =
      typeof rawId === 'number' && Number.isFinite(rawId)
        ? Math.floor(rawId)
        : Number.parseInt(String(rawId), 10);

    if (!Number.isFinite(companyId) || companyId < 1) {
      return next(new AppError(401, 'Invalid token payload.'));
    }

    req.companyId = companyId;
    req.companyEmail = typeof payload.email === 'string' ? payload.email : undefined;
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, 'Invalid or expired token.'));
    }
    next(err);
  }
}

module.exports = { requireAuth, getJwtSecret };
