import { env, isProduction } from '../config/env.js';
import { API_PREFIX } from '../constants/enums.js';

export const REFRESH_COOKIE = 'pf_refresh';

// The cookie is only ever sent to /auth/*, so ordinary API calls never carry it.
const baseOptions = () => ({
  httpOnly: true, // not readable from JavaScript, which limits the damage of an XSS bug
  secure: isProduction,
  sameSite: 'lax',
  path: `${API_PREFIX}/auth`,
  domain: env.COOKIE_DOMAIN,
});

export function setRefreshCookie(res, token, expiresAt) {
  res.cookie(REFRESH_COOKIE, token, { ...baseOptions(), expires: expiresAt });
}

export function clearRefreshCookie(res) {
  // Options must match the ones used to set the cookie or the browser keeps it.
  res.clearCookie(REFRESH_COOKIE, baseOptions());
}
