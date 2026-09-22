import { apiClient } from './axiosClient.js';
import { normalizeError } from './normalizeError.js';

/** RTK Query base query that goes through our Axios client (auth header + silent token refresh). */
export const axiosBaseQuery =
  () =>
  async ({ url, method = 'GET', data, params }) => {
    try {
      const response = await apiClient({ url, method, data, params });
      return { data: response.data.data, meta: response.data.meta };
    } catch (error) {
      return { error: normalizeError(error) };
    }
  };
