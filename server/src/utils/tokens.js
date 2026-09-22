import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

const ACCESS_ALGORITHM = 'HS256';

export function signAccessToken(user) {
  return jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, {
    algorithm: ACCESS_ALGORITHM,
    subject: String(user.id),
    expiresIn: env.ACCESS_TOKEN_TTL_MINUTES * 60,
  });
}

/** Returns the decoded payload or throws an AppError with a code the client can act on. */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: [ACCESS_ALGORITHM] });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.unauthenticated('Access token expired', 'TOKEN_EXPIRED');
    }
    throw AppError.unauthenticated('Invalid access token');
  }
}

/** Opaque 256-bit refresh token. Only its SHA-256 hash is ever stored. */
export function generateRefreshToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
