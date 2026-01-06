import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Dashboard Stats
export const fetchDashboardStats = createAsyncThunk(
  'admin/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats/overview`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

export const fetchRevenueAnalytics = createAsyncThunk(
  'admin/fetchRevenueAnalytics',
  async (period, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats/revenue`, { params: { period } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch revenue analytics');
    }
  }
);

export const fetchSalesAnalytics = createAsyncThunk(
  'admin/fetchSalesAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats/sales`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sales analytics');
    }
  }
);

export const fetchCustomerAnalytics = createAsyncThunk(
  'admin/fetchCustomerAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats/customers`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customer analytics');
    }
  }
);

// Sellers
export const fetchSellers = createAsyncThunk(
  'admin/fetchSellers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/admin/sellers`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sellers');
    }
  }
);

export const fetchSellerById = createAsyncThunk(
  'admin/fetchSellerById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/admin/sellers/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch seller');
    }
  }
);

export const verifySeller = createAsyncThunk(
  'admin/verifySeller',
  async ({ id, status, rejectionReason }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/admin/sellers/${id}/verify`, {
        status,
        rejectionReason,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify seller');
    }
  }
);

// Products
export const fetchProducts = createAsyncThunk(
  'admin/fetchProducts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/admin/products`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'admin/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/admin/products/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
    }
  }
);

// Orders
export const fetchOrders = createAsyncThunk(
  'admin/fetchOrders',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/admin/orders`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'admin/updateOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/admin/orders/${id}/status`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order');
    }
  }
);

// Customers
export const fetchCustomers = createAsyncThunk(
  'admin/fetchCustomers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/admin/customers`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customers');
    }
  }
);

const initialState = {
  dashboardStats: null,
  revenueAnalytics: null,
  salesAnalytics: null,
  customerAnalytics: null,
  sellers: [],
  selectedSeller: null,
  products: [],
  orders: [],
  customers: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedSeller: (state) => {
      state.selectedSeller = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Stats
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
      // Revenue Analytics
      .addCase(fetchRevenueAnalytics.fulfilled, (state, action) => {
        state.revenueAnalytics = action.payload;
      })
      // Sales Analytics
      .addCase(fetchSalesAnalytics.fulfilled, (state, action) => {
        state.salesAnalytics = action.payload;
      })
      // Customer Analytics
      .addCase(fetchCustomerAnalytics.fulfilled, (state, action) => {
        state.customerAnalytics = action.payload;
      })
      // Sellers
      .addCase(fetchSellers.fulfilled, (state, action) => {
        state.sellers = action.payload.sellers || action.payload;
      })
      .addCase(fetchSellerById.fulfilled, (state, action) => {
        state.selectedSeller = action.payload.seller || action.payload;
      })
      // Products
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products = action.payload.products || action.payload;
      })
      // Orders
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders = action.payload.orders || action.payload;
      })
      // Customers
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.customers = action.payload.customers || action.payload;
      });
  },
});

export const { clearError, clearSelectedSeller } = adminSlice.actions;
export default adminSlice.reducer;
