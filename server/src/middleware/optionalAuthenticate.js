import { authenticate } from './authenticate.js';

/**
 * For public endpoints that show extra information to signed-in users (e.g. "you own this project").
 * No Authorization header -> continue as a guest. A header that is present must be valid, so an
 * expired token still returns 401 TOKEN_EXPIRED and the client can refresh and retry.
 */
export function optionalAuthenticate(req, res, next) {
  if (!req.get('authorization')) return next();
  return authenticate(req, res, next);
}
