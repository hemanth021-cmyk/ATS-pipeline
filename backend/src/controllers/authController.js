/**
 * Company registration and login — issues JWT with companyId for subsequent API calls.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');
const { AppError } = require('../middleware/errorHandler');
const { getJwtSecret } = require('../middleware/requireAuth');

const BCRYPT_ROUNDS = 12;
const EMAIL_MAX = 255;
const PASSWORD_MIN = 8;

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function signToken(company) {
  const secret = getJwtSecret();
  if (!secret) {
    throw new AppError(500, 'JWT_SECRET is not configured.');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    { companyId: company.id, email: company.email },
    secret,
    { expiresIn, subject: String(company.id) }
  );
}

/**
 * POST /api/auth/register
 * Body: { email, password, name? }
 */
async function register(req, res, next) {
  try {
    const body = req.body ?? {};
    const email = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const name =
      body.name === undefined || body.name === null ? null : String(body.name).trim() || null;

    if (!email || email.length > EMAIL_MAX) {
      throw new AppError(400, 'A valid "email" is required.');
    }
    if (password.length < PASSWORD_MIN) {
      throw new AppError(400, `Password must be at least ${PASSWORD_MIN} characters.`);
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const insert = await pool.query(
      `INSERT INTO companies (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email, password_hash, name]
    );

    const company = insert.rows[0];
    const token = signToken(company);

    res.status(201).json({
      token,
      token_type: 'Bearer',
      company: {
        id: company.id,
        email: company.email,
        name: company.name,
        created_at: company.created_at,
      },
    });
  } catch (err) {
    if (err.code === '23505') {
      return next(new AppError(409, 'An account with this email already exists.'));
    }
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required.');
    }

    const result = await pool.query(
      `SELECT id, email, password_hash, name, created_at FROM companies WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError(401, 'Invalid email or password.');
    }

    const company = result.rows[0];
    const ok = await bcrypt.compare(password, company.password_hash);
    if (!ok) {
      throw new AppError(401, 'Invalid email or password.');
    }

    const token = signToken(company);

    res.json({
      token,
      token_type: 'Bearer',
      company: {
        id: company.id,
        email: company.email,
        name: company.name,
        created_at: company.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
};
