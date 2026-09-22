import { configureStore } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import { apiSlice } from '../api/apiSlice.js';
import { configureApiClient } from '../api/axiosClient.js';
import authReducer, { sessionExpired, tokenRefreshed } from '../features/auth/authSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
});

configureApiClient({
  getAccessToken: () => store.getState().auth.accessToken,
  onTokenRefreshed: (session) => store.dispatch(tokenRefreshed(session)),
  onSessionExpired: () => {
    // Only announce it when someone was actually signed in.
    if (store.getState().auth.status === 'authed') {
      toast.error('Your session expired. Please sign in again.');
    }
    store.dispatch(sessionExpired());
    store.dispatch(apiSlice.util.resetApiState());
  },
});
