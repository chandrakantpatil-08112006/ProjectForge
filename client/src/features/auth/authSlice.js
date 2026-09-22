import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient, refreshSession } from '../../api/axiosClient.js';
import { apiSlice } from '../../api/apiSlice.js';
import { normalizeError } from '../../api/normalizeError.js';

/**
 * status:
 *   'checking' -> app just loaded, asking the server whether the refresh cookie is still valid
 *   'authed'   -> signed in
 *   'guest'    -> signed out
 * Route guards wait while 'checking' so a page refresh never flashes the login screen.
 */
const initialState = { user: null, accessToken: null, status: 'checking' };

const request = (fn) => async (arg, { rejectWithValue }) => {
  try {
    return await fn(arg);
  } catch (error) {
    return rejectWithValue(normalizeError(error));
  }
};

export const bootstrapAuth = createAsyncThunk(
  'auth/bootstrap',
  request(() => refreshSession()),
);

export const registerUser = createAsyncThunk(
  'auth/register',
  request(async (values) => (await apiClient.post('/auth/register', values)).data.data),
);

export const loginUser = createAsyncThunk(
  'auth/login',
  request(async (values) => (await apiClient.post('/auth/login', values)).data.data),
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  request(async (changes) => (await apiClient.patch('/users/me', changes)).data.data.user),
);

export const logoutUser = createAsyncThunk('auth/logout', async (_arg, { dispatch }) => {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // Even if the server can't be reached we still sign out locally.
  }
  dispatch(apiSlice.util.resetApiState()); // drop cached private data (my projects, ...)
});

const signedIn = (state, { payload }) => {
  state.user = payload.user;
  state.accessToken = payload.accessToken;
  state.status = 'authed';
};

const signedOut = (state) => {
  state.user = null;
  state.accessToken = null;
  state.status = 'guest';
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Dispatched by the Axios interceptor after a silent refresh. */
    tokenRefreshed: signedIn,
    sessionExpired: signedOut,
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.fulfilled, signedIn)
      .addCase(bootstrapAuth.rejected, signedOut)
      .addCase(registerUser.fulfilled, signedIn)
      .addCase(loginUser.fulfilled, signedIn)
      .addCase(updateProfile.fulfilled, (state, { payload }) => {
        state.user = payload;
      })
      .addCase(logoutUser.fulfilled, signedOut);
  },
});

export const { tokenRefreshed, sessionExpired } = authSlice.actions;
export default authSlice.reducer;

export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';
