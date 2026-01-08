import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';
import { toast } from 'react-toastify';

const STORAGE_KEY = 'novamartActiveMode';

const readStoredMode = () => {
  if (typeof window === 'undefined') return 'buyer';
  return localStorage.getItem(STORAGE_KEY) || 'buyer';
};

const persistMode = (mode) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, mode);
};

const isSeller = (user) => user?.role === 'seller' || user?.accountType === 'seller';
const isAdmin = (user) => user?.role === 'admin' || user?.accountType === 'admin';

const resolveMode = (user, preferred = 'buyer') => {
  if (!user) return 'buyer';
  if (isAdmin(user)) return 'admin';
  if (!isSeller(user)) return 'buyer';
  if (!user.hasBuyerProfile) return 'seller';
  return preferred === 'seller' ? 'seller' : 'buyer';
};

const sanitizeMode = (user, requested) => {
  if (!user) return 'buyer';
  if (isAdmin(user)) return 'admin';
  if (!isSeller(user)) return 'buyer';
  if (requested === 'seller') return 'seller';
  if (requested === 'buyer' && user.hasBuyerProfile) return 'buyer';
  return user.hasBuyerProfile ? 'buyer' : 'seller';
};

const initialState = {
  user: null,
  status: 'idle',
  modeStatus: 'idle',
  error: null,
  isAuthenticated: false,
  activeMode: readStoredMode(),
};

export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', credentials);
      toast.success(data.message);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const createBuyerProfile = createAsyncThunk(
  'auth/createBuyerProfile',
  async ({ displayName }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/seller/buyer-profile', { displayName });
      toast.success(data.message || 'Buyer account ready');
      return data.user;
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to create buyer profile';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async ({ token, email }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/verify-email', { token, email });
      toast.success(data.message);
      return data.user;
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    toast.success(data.message || 'Login successful');
    return data.user;
  } catch (error) {
    const message = error.response?.data?.message || 'Login failed';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const fetchProfile = createAsyncThunk(
  'auth/profile',
  async (_, { rejectWithValue, getState }) => {
    // Skip if already checked and failed (guest user)
    const { auth } = getState();
    if (auth.status === 'failed' || auth.status === 'guest') {
      return rejectWithValue('Guest user');
    }
    try {
      const { data } = await api.get('/auth/me');
      return data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Unable to fetch profile');
    }
  },
  {
    condition: (_, { getState }) => {
      const { auth } = getState();
      // Don't fetch if already loading or if we've already determined user is guest
      if (auth.status === 'loading') {
        return false;
      }
      return true;
    },
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
    toast.success('Logged out successfully');
  } catch (error) {
    const message = error.response?.data?.message || 'Logout failed';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success(data.message);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Request failed';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/reset-password', { token, email, password });
      toast.success(data.message);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Reset failed';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.activeMode = resolveMode(action.payload, state.activeMode);
      persistMode(state.activeMode);
    },
    setActiveMode(state, action) {
      const nextMode = sanitizeMode(state.user, action.payload);
      state.activeMode = nextMode;
      persistMode(nextMode);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(verifyEmail.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true;
        state.activeMode = resolveMode(action.payload, state.activeMode);
        persistMode(state.activeMode);
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true;
        state.activeMode = resolveMode(action.payload, state.activeMode);
        persistMode(state.activeMode);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true;
        state.activeMode = resolveMode(action.payload, state.activeMode);
        persistMode(state.activeMode);
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = 'guest';
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.activeMode = 'buyer';
        persistMode('buyer');
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'idle';
        state.activeMode = 'buyer';
        persistMode('buyer');
      })
      .addCase(forgotPassword.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(resetPassword.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createBuyerProfile.pending, (state) => {
        state.modeStatus = 'loading';
        state.error = null;
      })
      .addCase(createBuyerProfile.fulfilled, (state, action) => {
        state.modeStatus = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true;
        state.activeMode = 'buyer';
        persistMode('buyer');
      })
      .addCase(createBuyerProfile.rejected, (state, action) => {
        state.modeStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearError, setUser, setActiveMode } = authSlice.actions;
export default authSlice.reducer;
