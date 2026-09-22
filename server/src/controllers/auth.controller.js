import * as authService from '../services/auth.service.js';
import { withSkills } from '../services/user.service.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from '../utils/cookies.js';

const requestMeta = (req) => ({ ip: req.ip, userAgent: req.get('user-agent') });

/** Auth responses contain tokens, so they must never be cached by browsers or proxies. */
function respondWithSession(res, { user, accessToken, refreshToken, refreshExpiresAt }, status = 200) {
  setRefreshCookie(res, refreshToken, refreshExpiresAt);
  res.set('Cache-Control', 'no-store');
  const payload = { user, accessToken };
  return status === 201 ? sendCreated(res, payload) : sendSuccess(res, payload);
}

export async function register(req, res) {
  const result = await authService.register(req.validated.body, requestMeta(req));
  respondWithSession(res, result, 201);
}

export async function login(req, res) {
  const result = await authService.login(req.validated.body, requestMeta(req));
  respondWithSession(res, result);
}

export async function refresh(req, res) {
  // A failed refresh deliberately does NOT clear the cookie: if another tab has just rotated the
  // token, the browser already holds the new one and clearing here would sign that tab out.
  // (An expired or unknown cookie is harmless; it simply fails again until the browser drops it.)
  const result = await authService.refresh(req.cookies?.[REFRESH_COOKIE], requestMeta(req));
  respondWithSession(res, result);
}

export async function logout(req, res) {
  await authService.logout(req.cookies?.[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, { message: 'Logged out' });
}

export async function me(req, res) {
  sendSuccess(res, { user: await withSkills(req.user) });
}
