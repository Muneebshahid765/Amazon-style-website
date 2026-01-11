import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

// ==================== DASHBOARD STATS ====================
export const fetchDashboardStats = createAsyncThunk(
  'admin/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/stats/overview');
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
      const response = await api.get('/admin/stats/revenue', { params: { period } });
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
      const response = await api.get('/admin/stats/sales');
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
      const response = await api.get('/admin/stats/customers');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customer analytics');
    }
  }
);

export const fetchPlatformStats = createAsyncThunk(
  'admin/fetchPlatformStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/stats/platform');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch platform stats');
    }
  }
);

// ==================== SELLERS ====================
export const fetchSellers = createAsyncThunk(
  'admin/fetchSellers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/sellers', { params });
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
      const response = await api.get(`/admin/sellers/${id}`);
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
      const response = await api.put(`/admin/sellers/${id}/verify`, { status, rejectionReason });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify seller');
    }
  }
);

// ==================== PRODUCTS ====================
export const fetchProducts = createAsyncThunk(
  'admin/fetchProducts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/products', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const createProduct = createAsyncThunk(
  'admin/createProduct',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create product');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'admin/updateProduct',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update product');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'admin/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/admin/products/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
    }
  }
);

// ==================== ORDERS ====================
export const fetchOrders = createAsyncThunk(
  'admin/fetchOrders',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/orders', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'admin/fetchOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/orders/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'admin/updateOrderStatus',
  async ({ id, status, note }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/orders/${id}/status`, { status, note });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'admin/cancelOrder',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/orders/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
    }
  }
);

export const refundOrder = createAsyncThunk(
  'admin/refundOrder',
  async ({ id, reason, refundAmount }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/orders/${id}/refund`, { reason, refundAmount });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to refund order');
    }
  }
);

// ==================== CUSTOMERS ====================
export const fetchCustomers = createAsyncThunk(
  'admin/fetchCustomers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/customers', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customers');
    }
  }
);

export const fetchCustomerById = createAsyncThunk(
  'admin/fetchCustomerById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/customers/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customer');
    }
  }
);

export const updateCustomerStatus = createAsyncThunk(
  'admin/updateCustomerStatus',
  async ({ id, accountStatus, reason }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/customers/${id}/status`, { accountStatus, reason });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update customer status');
    }
  }
);

// ==================== REVIEWS ====================
export const fetchReviews = createAsyncThunk(
  'admin/fetchReviews',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/reviews', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }
);

export const updateReviewStatus = createAsyncThunk(
  'admin/updateReviewStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/reviews/${id}/status`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update review status');
    }
  }
);

export const deleteReview = createAsyncThunk(
  'admin/deleteReview',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/admin/reviews/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete review');
    }
  }
);

// ==================== COUPONS ====================
export const fetchCoupons = createAsyncThunk(
  'admin/fetchCoupons',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/coupons', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch coupons');
    }
  }
);

export const createCoupon = createAsyncThunk(
  'admin/createCoupon',
  async (couponData, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/coupons', couponData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create coupon');
    }
  }
);

export const updateCoupon = createAsyncThunk(
  'admin/updateCoupon',
  async ({ id, ...couponData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/coupons/${id}`, couponData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update coupon');
    }
  }
);

export const deleteCoupon = createAsyncThunk(
  'admin/deleteCoupon',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/admin/coupons/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete coupon');
    }
  }
);

// ==================== CATEGORIES ====================
export const fetchCategories = createAsyncThunk(
  'admin/fetchCategories',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/categories', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'admin/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/categories', categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create category');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'admin/updateCategory',
  async ({ id, ...categoryData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update category');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'admin/deleteCategory',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/admin/categories/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete category');
    }
  }
);

// ==================== ACTIVITY LOGS ====================
export const fetchActivityLogs = createAsyncThunk(
  'admin/fetchActivityLogs',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/activity', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch activity logs');
    }
  }
);

// ==================== SUBSCRIPTION PLANS ====================
export const fetchSubscriptionPlans = createAsyncThunk(
  'admin/fetchSubscriptionPlans',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/subscriptions/plans', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription plans');
    }
  }
);

export const createSubscriptionPlan = createAsyncThunk(
  'admin/createSubscriptionPlan',
  async (planData, { rejectWithValue }) => {
    try {
      const response = await api.post('/subscriptions/plans', planData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create subscription plan');
    }
  }
);

export const updateSubscriptionPlan = createAsyncThunk(
  'admin/updateSubscriptionPlan',
  async ({ id, ...planData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/subscriptions/plans/${id}`, planData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update subscription plan');
    }
  }
);

export const deleteSubscriptionPlan = createAsyncThunk(
  'admin/deleteSubscriptionPlan',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/subscriptions/plans/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete subscription plan');
    }
  }
);

export const deleteSubscriptionPlansBulk = createAsyncThunk(
  'admin/deleteSubscriptionPlansBulk',
  async (planIds, { rejectWithValue }) => {
    try {
      const response = await api.post('/subscriptions/plans/bulk-delete', { planIds });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to delete plans' });
    }
  }
);

export const togglePlanStatus = createAsyncThunk(
  'admin/togglePlanStatus',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/subscriptions/plans/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle plan status');
    }
  }
);

export const assignPlanToUser = createAsyncThunk(
  'admin/assignPlanToUser',
  async ({ userId, planId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/subscriptions/assign', { userId, planId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign plan to user');
    }
  }
);

export const applyBulkDiscountToPlans = createAsyncThunk(
  'admin/applyBulkDiscountToPlans',
  async ({ planIds = [], applyToAll = false, discount }, { rejectWithValue }) => {
    try {
      const response = await api.post('/subscriptions/plans/bulk-discount', {
        planIds,
        applyToAll,
        discount,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply bulk discount');
    }
  }
);

export const fetchSubscriptionStats = createAsyncThunk(
  'admin/fetchSubscriptionStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/subscriptions/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription stats');
    }
  }
);

export const fetchUsersWithSubscriptions = createAsyncThunk(
  'admin/fetchUsersWithSubscriptions',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/subscriptions/users', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users with subscriptions');
    }
  }
);

// ==================== INITIAL STATE ====================
const initialState = {
  dashboardStats: null,
  revenueAnalytics: null,
  salesAnalytics: null,
  customerAnalytics: null,
  platformStats: null,
  sellers: [],
  selectedSeller: null,
  products: [],
  selectedProduct: null,
  orders: [],
  orderStatusCounts: {},
  selectedOrder: null,
  customers: [],
  selectedCustomer: null,
  reviews: [],
  reviewStatusCounts: {},
  coupons: [],
  categories: [],
  activityLogs: [],
  subscriptionPlans: [],
  subscriptionStats: null,
  usersWithSubscriptions: [],
  pagination: {
    total: 0,
    totalPages: 1,
    currentPage: 1,
  },
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
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
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
      // Platform Stats
      .addCase(fetchPlatformStats.fulfilled, (state, action) => {
        state.platformStats = action.payload;
      })
      // Sellers
      .addCase(fetchSellers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSellers.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = action.payload.sellers || [];
        state.pagination = {
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
          currentPage: action.payload.currentPage || 1,
        };
      })
      .addCase(fetchSellers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSellerById.pending, (state) => {
        state.loading = true;
        state.selectedSeller = null;
      })
      .addCase(fetchSellerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedSeller = action.payload;
      })
      .addCase(fetchSellerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products || [];
        state.pagination = {
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
          currentPage: action.payload.currentPage || 1,
        };
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p._id !== action.payload.id);
      })
      // Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders || [];
        state.orderStatusCounts = action.payload.statusCounts || {};
        state.pagination = {
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
          currentPage: action.payload.currentPage || 1,
        };
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.selectedOrder = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload.order;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.customers || [];
        state.pagination = {
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
          currentPage: action.payload.currentPage || 1,
        };
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true;
        state.selectedCustomer = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCustomer = action.payload;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reviews
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.reviews || [];
        state.reviewStatusCounts = action.payload.statusCounts || {};
        state.pagination = {
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
          currentPage: action.payload.currentPage || 1,
        };
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter((r) => r._id !== action.payload.id);
      })
      // Coupons
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload.coupons || [];
        state.pagination = {
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
          currentPage: action.payload.currentPage || 1,
        };
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.coupons.unshift(action.payload.coupon);
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.coupons = state.coupons.filter((c) => c._id !== action.payload.id);
      })
      // Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.categories || [];
        state.pagination = {
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
          currentPage: action.payload.currentPage || 1,
        };
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.unshift(action.payload.category);
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter((c) => c._id !== action.payload.id);
      })
      // Activity Logs
      .addCase(fetchActivityLogs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.activityLogs = action.payload.activities || [];
        state.pagination = {
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
          currentPage: action.payload.currentPage || 1,
        };
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Subscription Plans
      .addCase(fetchSubscriptionPlans.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptionPlans = action.payload.plans || [];
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSubscriptionPlan.fulfilled, (state, action) => {
        state.subscriptionPlans.unshift(action.payload.plan);
      })
      .addCase(updateSubscriptionPlan.fulfilled, (state, action) => {
        const index = state.subscriptionPlans.findIndex(p => p._id === action.payload.plan._id);
        if (index !== -1) {
          state.subscriptionPlans[index] = action.payload.plan;
        }
      })
      .addCase(deleteSubscriptionPlan.fulfilled, (state, action) => {
        state.subscriptionPlans = state.subscriptionPlans.filter(p => p._id !== action.payload.id);
      })
      .addCase(deleteSubscriptionPlansBulk.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteSubscriptionPlansBulk.fulfilled, (state, action) => {
        state.loading = false;
        const deletedIds = action.payload.deletedIds || [];
        state.subscriptionPlans = state.subscriptionPlans.filter(
          (plan) => !deletedIds.includes(plan._id)
        );
      })
      .addCase(deleteSubscriptionPlansBulk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload;
      })
      .addCase(togglePlanStatus.fulfilled, (state, action) => {
        const index = state.subscriptionPlans.findIndex(p => p._id === action.payload.plan._id);
        if (index !== -1) {
          state.subscriptionPlans[index] = action.payload.plan;
        }
      })
      // Subscription Stats
      .addCase(fetchSubscriptionStats.fulfilled, (state, action) => {
        state.subscriptionStats = action.payload;
      })
      // Users with Subscriptions
      .addCase(fetchUsersWithSubscriptions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsersWithSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.usersWithSubscriptions = action.payload.users || [];
        state.pagination = {
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
          currentPage: action.payload.currentPage || 1,
        };
      })
      .addCase(fetchUsersWithSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(applyBulkDiscountToPlans.pending, (state) => {
        state.loading = true;
      })
      .addCase(applyBulkDiscountToPlans.fulfilled, (state, action) => {
        state.loading = false;
        const updatedPlans = action.payload.plans || [];
        if (!updatedPlans.length) return;
        state.subscriptionPlans = state.subscriptionPlans.map((plan) => {
          const match = updatedPlans.find((updated) => updated._id === plan._id);
          return match || plan;
        });
      })
      .addCase(applyBulkDiscountToPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSelectedSeller, clearSelectedOrder, clearSelectedCustomer } = adminSlice.actions;
export default adminSlice.reducer;
