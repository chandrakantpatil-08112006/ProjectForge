/** Turns any Axios failure into { status, code, message, details } so the UI handles one shape. */
export function normalizeError(error) {
  if (error?.response) {
    const { status, data } = error.response;
    const apiError = data?.error;
    return {
      status,
      code: apiError?.code ?? 'UNKNOWN_ERROR',
      message: apiError?.message ?? 'Something went wrong. Please try again.',
      details: apiError?.details ?? [],
      requestId: apiError?.requestId,
    };
  }
  if (error?.code === 'ECONNABORTED') {
    return { status: 0, code: 'TIMEOUT', message: 'The server took too long to respond. Please try again.', details: [] };
  }
  return {
    status: 0,
    code: 'NETWORK_ERROR',
    message: 'Cannot reach the server. Check your connection and try again.',
    details: [],
  };
}
