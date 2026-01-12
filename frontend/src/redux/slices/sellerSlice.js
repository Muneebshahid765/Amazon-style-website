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

export const fetchOrderDetail = createAsyncThunk(
  'seller/fetchOrderDetail',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/seller/orders/${orderId}`);
      return response.data.order || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order detail');
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

// Performance Metrics
export const fetchPerformanceMetrics = createAsyncThunk(
  'seller/fetchPerformanceMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/dashboard/performance');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch performance metrics');
    }
  }
);

// Transactions
export const fetchTransactions = createAsyncThunk(
  'seller/fetchTransactions',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/earnings/transactions', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

// Payout History
export const fetchPayoutHistory = createAsyncThunk(
  'seller/fetchPayoutHistory',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/earnings/payouts', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payout history');
    }
  }
);

// Payout Settings
export const fetchPayoutSettings = createAsyncThunk(
  'seller/fetchPayoutSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/payout-settings');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payout settings');
    }
  }
);

export const updatePayoutSettings = createAsyncThunk(
  'seller/updatePayoutSettings',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.put('/seller/payout-settings', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update payout settings');
    }
  }
);

// Business Info
export const updateBusinessInfo = createAsyncThunk(
  'seller/updateBusinessInfo',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.put('/seller/store/business-info', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update business info');
    }
  }
);

// Vacation Mode
export const updateVacationMode = createAsyncThunk(
  'seller/updateVacationMode',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.put('/seller/store/vacation-mode', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update vacation mode');
    }
  }
);

// Reports
export const fetchSalesReport = createAsyncThunk(
  'seller/fetchSalesReport',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/reports/sales', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sales report');
    }
  }
);

export const fetchInventoryReport = createAsyncThunk(
  'seller/fetchInventoryReport',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/reports/inventory');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch inventory report');
    }
  }
);

// Bulk Operations
export const bulkUpdateStock = createAsyncThunk(
  'seller/bulkUpdateStock',
  async (updates, { rejectWithValue }) => {
    try {
      const response = await api.post('/seller/products/bulk/stock', { updates });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to bulk update stock');
    }
  }
);

export const bulkUpdatePrices = createAsyncThunk(
  'seller/bulkUpdatePrices',
  async (updates, { rejectWithValue }) => {
    try {
      const response = await api.post('/seller/products/bulk/prices', { updates });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to bulk update prices');
    }
  }
);

// Categories
export const fetchCategories = createAsyncThunk(
  'seller/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/categories');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

// Verification
export const fetchSellerVerification = createAsyncThunk(
  'seller/fetchSellerVerification',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/verification');
      return response.data.verification || null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch verification status');
    }
  }
);

export const createVerificationPaymentIntent = createAsyncThunk(
  'seller/createVerificationPaymentIntent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/seller/verification/payment-intent');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create payment intent');
    }
  }
);

export const submitSellerVerification = createAsyncThunk(
  'seller/submitSellerVerification',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/seller/verification', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit verification');
    }
  }
);

// Seller Coupons
export const fetchSellerCoupons = createAsyncThunk(
  'seller/fetchSellerCoupons',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/coupons', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch coupons');
    }
  }
);

export const createSellerCoupon = createAsyncThunk(
  'seller/createSellerCoupon',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/seller/coupons', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create coupon');
    }
  }
);

export const updateSellerCoupon = createAsyncThunk(
  'seller/updateSellerCoupon',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/seller/coupons/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update coupon');
    }
  }
);

export const deleteSellerCoupon = createAsyncThunk(
  'seller/deleteSellerCoupon',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/seller/coupons/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete coupon');
    }
  }
);

// Subscription Status
export const fetchSubscriptionStatus = createAsyncThunk(
  'seller/fetchSubscriptionStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/seller/subscription/status');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription status');
    }
  }
);

const initialState = {
  dashboardStats: null,
  salesOverview: null,
  performanceMetrics: null,
  products: [],
  currentProduct: null,
  selectedProduct: null,
  categories: [],
  orders: [],
  orderDetail: null,
  earnings: null,
  transactions: [],
  transactionSummary: {
    totalDebits: 0,
    totalCredits: 0,
    net: 0,
  },
  payoutHistory: [],
  payoutSettings: null,
  store: null,
  reviews: [],
  analytics: null,
  salesReport: null,
  inventoryReport: null,
  pagination: { total: 0, totalPages: 1, currentPage: 1 },
  verification: null,
  verificationPaymentIntent: null,
  verificationLoading: false,
  verificationError: null,
  coupons: [],
  couponPagination: { total: 0, totalPages: 1, currentPage: 1 },
  couponsLoading: false,
  couponsError: null,
  subscriptionStatus: null,
  subscriptionLoading: false,
  loading: false,
  detailsLoading: false,
  orderDetailLoading: false,
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
      .addCase(fetchOrderDetail.pending, (state) => {
        state.orderDetailLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderDetail.fulfilled, (state, action) => {
        state.orderDetailLoading = false;
        state.orderDetail = action.payload;
      })
      .addCase(fetchOrderDetail.rejected, (state, action) => {
        state.orderDetailLoading = false;
        state.error = action.payload;
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
      .addCase(fetchProductAnalytics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchProductAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Sales Report
      .addCase(fetchSalesReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSalesReport.fulfilled, (state, action) => {
        state.loading = false;
        state.salesReport = action.payload;
      })
      .addCase(fetchSalesReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Bulk Operations
      .addCase(bulkUpdateStock.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkUpdateStock.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(bulkUpdateStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(bulkUpdatePrices.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkUpdatePrices.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(bulkUpdatePrices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Performance Metrics
      .addCase(fetchPerformanceMetrics.fulfilled, (state, action) => {
        state.performanceMetrics = action.payload;
      })
      // Transactions
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload.transactions || [];
        state.pagination = {
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
          currentPage: action.payload.currentPage || 1,
        };
        state.transactionSummary = action.payload.summary || {
          totalDebits: 0,
          totalCredits: 0,
          net: 0,
        };
      })
      // Payout History
      .addCase(fetchPayoutHistory.fulfilled, (state, action) => {
        state.payoutHistory = action.payload.payouts || [];
        state.pagination = {
          total: action.payload.total,
          totalPages: action.payload.totalPages,
          currentPage: action.payload.currentPage,
        };
      })
      // Payout Settings
      .addCase(fetchPayoutSettings.fulfilled, (state, action) => {
        state.payoutSettings = action.payload.payoutSettings || action.payload;
      })
      .addCase(updatePayoutSettings.fulfilled, (state, action) => {
        state.payoutSettings = action.payload.store || action.payload;
      })
      // Business Info & Vacation Mode
      .addCase(updateBusinessInfo.fulfilled, (state, action) => {
        state.store = action.payload.store || action.payload;
      })
      .addCase(updateVacationMode.fulfilled, (state, action) => {
        state.store = action.payload.store || action.payload;
      })
      .addCase(fetchInventoryReport.fulfilled, (state, action) => {
        state.inventoryReport = action.payload;
      })
      // Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload.categories || [];
      })
      // Verification
      .addCase(fetchSellerVerification.pending, (state) => {
        state.verificationLoading = true;
        state.verificationError = null;
      })
      .addCase(fetchSellerVerification.fulfilled, (state, action) => {
        state.verificationLoading = false;
        state.verification = action.payload;
      })
      .addCase(fetchSellerVerification.rejected, (state, action) => {
        state.verificationLoading = false;
        state.verificationError = action.payload;
      })
      .addCase(createVerificationPaymentIntent.pending, (state) => {
        state.verificationLoading = true;
        state.verificationError = null;
      })
      .addCase(createVerificationPaymentIntent.fulfilled, (state, action) => {
        state.verificationLoading = false;
        state.verificationPaymentIntent = action.payload;
      })
      .addCase(createVerificationPaymentIntent.rejected, (state, action) => {
        state.verificationLoading = false;
        state.verificationError = action.payload;
      })
      .addCase(submitSellerVerification.pending, (state) => {
        state.verificationLoading = true;
        state.verificationError = null;
      })
      .addCase(submitSellerVerification.fulfilled, (state, action) => {
        state.verificationLoading = false;
        state.verification = action.payload.verification;
      })
      .addCase(submitSellerVerification.rejected, (state, action) => {
        state.verificationLoading = false;
        state.verificationError = action.payload;
      })
      // Seller Coupons
      .addCase(fetchSellerCoupons.pending, (state) => {
        state.couponsLoading = true;
        state.couponsError = null;
      })
      .addCase(fetchSellerCoupons.fulfilled, (state, action) => {
        state.couponsLoading = false;
        state.coupons = action.payload.coupons || [];
        state.couponPagination = {
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
          currentPage: action.payload.currentPage || 1,
        };
      })
      .addCase(fetchSellerCoupons.rejected, (state, action) => {
        state.couponsLoading = false;
        state.couponsError = action.payload;
      })
      .addCase(createSellerCoupon.fulfilled, (state, action) => {
        state.coupons.unshift(action.payload.coupon);
        state.couponPagination.total += 1;
      })
      .addCase(updateSellerCoupon.fulfilled, (state, action) => {
        const updated = action.payload.coupon;
        state.coupons = state.coupons.map((c) => (c._id === updated._id ? updated : c));
      })
      .addCase(deleteSellerCoupon.fulfilled, (state, action) => {
        state.coupons = state.coupons.filter((c) => c._id !== action.payload);
        state.couponPagination.total = Math.max(0, state.couponPagination.total - 1);
      })
      // Subscription Status
      .addCase(fetchSubscriptionStatus.pending, (state) => {
        state.subscriptionLoading = true;
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        state.subscriptionLoading = false;
        state.subscriptionStatus = action.payload;
      })
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.subscriptionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSelectedProduct } = sellerSlice.actions;
export default sellerSlice.reducer;
