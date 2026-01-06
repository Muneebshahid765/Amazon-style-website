import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';
import { toast } from 'react-toastify';

const initialState = {
  profile: null,
  addresses: [],
  wishlist: [],
  orders: [],
  orderDetails: null,
  status: 'idle',
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  },
};

export const fetchUserProfile = createAsyncThunk('user/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users/profile');
    return data.user;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
  }
});

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (updates, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/users/profile', updates);
      toast.success(data.message);
      return data.user;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const changePassword = createAsyncThunk(
  'user/changePassword',
  async (passwords, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/users/change-password', passwords);
      toast.success(data.message);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const uploadAvatar = createAsyncThunk('user/uploadAvatar', async (file, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    toast.success(data.message);
    return data.avatar;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to upload avatar';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const deleteAvatar = createAsyncThunk('user/deleteAvatar', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.delete('/users/avatar');
    toast.success(data.message);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to delete avatar';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const fetchAddresses = createAsyncThunk('user/fetchAddresses', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users/addresses');
    return data.addresses;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch addresses');
  }
});

export const addAddress = createAsyncThunk('user/addAddress', async (address, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/users/addresses', address);
    toast.success(data.message);
    return data.addresses;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to add address';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const updateAddress = createAsyncThunk(
  'user/updateAddress',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/users/addresses/${id}`, updates);
      toast.success(data.message);
      return data.addresses;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update address';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteAddress = createAsyncThunk('user/deleteAddress', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.delete(`/users/addresses/${id}`);
    toast.success(data.message);
    return data.addresses;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to delete address';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const setDefaultAddress = createAsyncThunk('user/setDefaultAddress', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/users/addresses/${id}/default`);
    toast.success(data.message);
    return data.addresses;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to set default address';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const fetchWishlist = createAsyncThunk('user/fetchWishlist', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users/wishlist');
    return data.wishlist;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
  }
});

export const addToWishlist = createAsyncThunk('user/addToWishlist', async (productId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/users/wishlist/${productId}`);
    toast.success(data.message);
    return productId;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to add to wishlist';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const removeFromWishlist = createAsyncThunk(
  'user/removeFromWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/users/wishlist/${productId}`);
      toast.success(data.message);
      return productId;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove from wishlist';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchUserOrders = createAsyncThunk(
  'user/fetchOrders',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const { data } = await api.get(`/users/orders?${params}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchOrderDetails = createAsyncThunk('user/fetchOrderDetails', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/users/orders/${id}`);
    return data.order;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch order details');
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearOrderDetails(state) {
      state.orderDetails = null;
    },
    optimisticAddToWishlist(state, action) {
      if (!state.wishlist.find((item) => item._id === action.payload._id)) {
        state.wishlist.push(action.payload);
      }
    },
    optimisticRemoveFromWishlist(state, action) {
      state.wishlist = state.wishlist.filter((item) => item._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.avatar = action.payload;
        }
      })
      .addCase(deleteAvatar.fulfilled, (state) => {
        if (state.profile) {
          state.profile.avatar = undefined;
        }
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.wishlist = action.payload;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        if (!state.wishlist.includes(action.payload)) {
          state.wishlist.push(action.payload);
        }
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.wishlist = state.wishlist.filter((item) => item._id !== action.payload);
      })
      .addCase(fetchUserOrders.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.orders = action.payload.orders;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          total: action.payload.total,
        };
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.orderDetails = action.payload;
      });
  },
});

export const { clearError, clearOrderDetails, optimisticAddToWishlist, optimisticRemoveFromWishlist } =
  userSlice.actions;
export default userSlice.reducer;
