import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({ baseURL, withCredentials: true, timeout: 15_000 });

// A second instance without interceptors, so a failing refresh can't trigger another refresh.
const refreshClient = axios.create({ baseURL, withCredentials: true, timeout: 15_000 });

let handlers = {
  getAccessToken: () => null,
  onTokenRefreshed: () => {},
  onSessionExpired: () => {},
};

/** The store injects these callbacks, which keeps this module free of a circular import. */
export function configureApiClient(next) {
  handlers = { ...handlers, ...next };
}

let refreshPromise = null;

/**
 * Exchanges the httpOnly refresh cookie for a new access token.
 * Concurrent callers share ONE request: refresh tokens rotate, so a second parallel call
 * would present an already-used token.
 */
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/auth/refresh')
      .then((response) => response.data.data)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = handlers.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AUTH_URLS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const sentToken = Boolean(config?.headers?.Authorization);
    const isAuthCall = AUTH_URLS.some((url) => config?.url?.startsWith(url));

    // Expired access token: refresh once, then replay the original request.
    if (response?.status === 401 && sentToken && !isAuthCall && !config._retried) {
      config._retried = true;
      try {
        const session = await refreshSession();
        handlers.onTokenRefreshed(session);
        config.headers.Authorization = `Bearer ${session.accessToken}`;
        return apiClient(config);
      } catch {
        handlers.onSessionExpired();
      }
    }
    return Promise.reject(error);
  },
);
