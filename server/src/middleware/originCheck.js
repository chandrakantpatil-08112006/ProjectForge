import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * CSRF defence-in-depth for the cookie-authenticated auth endpoints.
 * Browsers always send Origin on cross-site POSTs, so a mismatch means a foreign site.
 * Requests without Origin (curl, server-to-server, tests) can't be CSRF and are allowed.
 */
export function originCheck(req, _res, next) {
  const origin = req.get('origin');
  if (origin && origin !== env.CLIENT_ORIGIN) {
    throw AppError.forbidden('Origin not allowed');
  }
  next();
}
