import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/tokens.js';

/**
 * Verifies the Bearer access token, then loads the user so that suspending or deleting
 * an account takes effect on the very next request (not when the token expires).
 * Sets req.user to the Mongoose document.
 */
export async function authenticate(req, _res, next) {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw AppError.unauthenticated();
  }

  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub);

  if (!user || user.status === 'deleted') {
    throw AppError.unauthenticated();
  }
  if (user.status === 'suspended') {
    throw AppError.forbidden('Your account has been suspended', 'ACCOUNT_SUSPENDED');
  }

  req.user = user;
  next();
}
