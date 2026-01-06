import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

// Dashboard
export const fetchDashboardStats = createAsyncThunk(
  'seller/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/dashboard/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

export const fetchSalesOverview = createAsyncThunk(
  'seller/fetchSalesOverview',
  async (period, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/dashboard/sales-overview', {
        params: { period },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sales overview');
    }
  }
);

// Products
export const fetchProducts = createAsyncThunk(
  'seller/fetchProducts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/products', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchProductDetails = createAsyncThunk(
  'seller/fetchProductDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/seller/products/${id}`);
      return response.data.product || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch product details');
    }
  }
);

export const createProduct = createAsyncThunk(
  'seller/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const config =
        productData instanceof FormData
          ? { headers: { 'Content-Type': 'multipart/form-data' } }
          : undefined;
      const response = await api.post('/seller/products', productData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create product');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'seller/updateProduct',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const config =
        data instanceof FormData
          ? { headers: { 'Content-Type': 'multipart/form-data' } }
          : undefined;
      const response = await api.put(`/seller/products/${id}`, data, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update product');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'seller/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/seller/products/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
    }
  }
);

export const updateStock = createAsyncThunk(
  'seller/updateStock',
  async ({ id, stock }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/seller/products/${id}/stock`, { stock });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update stock');
    }
  }
);

// Orders
export const fetchOrders = createAsyncThunk(
  'seller/fetchOrders',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/orders', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const updateOrderItemStatus = createAsyncThunk(
  'seller/updateOrderItemStatus',
  async ({ orderId, itemId, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/seller/orders/${orderId}/items/${itemId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
    }
  }
);

export const addTrackingInfo = createAsyncThunk(
  'seller/addTrackingInfo',
  async ({ orderId, itemId, trackingInfo }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/seller/orders/${orderId}/items/${itemId}/tracking`, trackingInfo);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add tracking info');
    }
  }
);

// Earnings
export const fetchEarnings = createAsyncThunk(
  'seller/fetchEarnings',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/earnings', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch earnings');
    }
  }
);

export const requestPayout = createAsyncThunk(
  'seller/requestPayout',
  async (payoutData, { rejectWithValue }) => {
    try {
      const response = await api.post('/seller/earnings/payout', payoutData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to request payout');
    }
  }
);

// Store
export const fetchStore = createAsyncThunk(
  'seller/fetchStore',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/store');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch store');
    }
  }
);

export const updateStore = createAsyncThunk(
  'seller/updateStore',
  async (storeData, { rejectWithValue }) => {
    try {
      const response = await api.put('/seller/store', storeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update store');
    }
  }
);

// Reviews
export const fetchReviews = createAsyncThunk(
  'seller/fetchReviews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/reviews');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }
);

export const replyToReview = createAsyncThunk(
  'seller/replyToReview',
  async ({ id, reply }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/seller/reviews/${id}/reply`, { reply });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reply to review');
    }
  }
);

// Analytics
export const fetchProductAnalytics = createAsyncThunk(
  'seller/fetchProductAnalytics',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/products/analytics', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

const initialState = {
  dashboardStats: null,
  salesOverview: null,
  products: [],
  currentProduct: null,
  selectedProduct: null,
  orders: [],
  earnings: null,
  store: null,
  reviews: [],
  analytics: null,
  loading: false,
  detailsLoading: false,
  error: null,
};

const sellerSlice = createSlice({
  name: 'seller',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSalesOverview.fulfilled, (state, action) => {
        state.salesOverview = action.payload;
      })
      // Products
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products = action.payload.products || action.payload;
      })
      .addCase(fetchProductDetails.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.products.unshift(action.payload.product);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex((p) => p._id === action.payload.product._id);
        if (index !== -1) {
          state.products[index] = action.payload.product;
        }
        if (state.currentProduct?. _id === action.payload.product._id) {
          state.currentProduct = action.payload.product;
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p._id !== action.meta.arg);
      })
      // Orders
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders = action.payload.orders || action.payload;
      })
      // Earnings
      .addCase(fetchEarnings.fulfilled, (state, action) => {
        state.earnings = action.payload;
      })
      // Store
      .addCase(fetchStore.fulfilled, (state, action) => {
        state.store = action.payload.store || action.payload;
      })
      .addCase(updateStore.fulfilled, (state, action) => {
        state.store = action.payload.store || action.payload;
      })
      // Reviews
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.reviews = action.payload.reviews || action.payload;
      })
      // Analytics
      .addCase(fetchProductAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      });
  },
});

export const { clearError, clearSelectedProduct } = sellerSlice.actions;
export default sellerSlice.reducer;
