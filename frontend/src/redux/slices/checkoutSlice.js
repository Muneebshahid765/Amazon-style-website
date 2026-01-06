import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';
import { toast } from 'react-toastify';

const initialState = {
  currentStep: 1,
  shippingAddress: null,
  shippingMethod: 'standard',
  paymentMethod: 'cod',
  couponApplied: null,
  orderSummary: {
    subtotal: 0,
    tax: 0,
    shippingCost: 0,
    discount: 0,
    total: 0,
  },
  availableCoupons: [],
  status: 'idle',
  error: null,
};

export const validateCheckout = createAsyncThunk(
  'checkout/validate',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/checkout/validate');
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Validation failed';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const applyCoupon = createAsyncThunk(
  'checkout/applyCoupon',
  async (code, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/checkout/apply-coupon', { code });
      toast.success(data.message);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to apply coupon';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const calculateCheckout = createAsyncThunk(
  'checkout/calculate',
  async (shippingMethod, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/checkout/calculate', { shippingMethod });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Calculation failed');
    }
  }
);

export const createOrder = createAsyncThunk(
  'checkout/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/checkout/orders', orderData);
      toast.success(data.message);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create order';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchAvailableCoupons = createAsyncThunk(
  'checkout/fetchCoupons',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/checkout/coupons/available');
      return data.coupons;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch coupons');
    }
  }
);

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setCurrentStep(state, action) {
      state.currentStep = action.payload;
    },
    setShippingAddress(state, action) {
      state.shippingAddress = action.payload;
    },
    setShippingMethod(state, action) {
      state.shippingMethod = action.payload;
    },
    setPaymentMethod(state, action) {
      state.paymentMethod = action.payload;
    },
    removeCoupon(state) {
      state.couponApplied = null;
      state.orderSummary.discount = 0;
      state.orderSummary.total = state.orderSummary.subtotal + state.orderSummary.tax + state.orderSummary.shippingCost;
    },
    resetCheckout(state) {
      return initialState;
    },
    nextStep(state) {
      if (state.currentStep < 4) {
        state.currentStep += 1;
      }
    },
    previousStep(state) {
      if (state.currentStep > 1) {
        state.currentStep -= 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(validateCheckout.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(validateCheckout.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.orderSummary.subtotal = action.payload.cart.subtotal;
      })
      .addCase(validateCheckout.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.couponApplied = action.payload.coupon;
        state.orderSummary.discount = action.payload.coupon.discount;
        state.orderSummary.total = action.payload.newTotal;
      })
      .addCase(calculateCheckout.fulfilled, (state, action) => {
        state.orderSummary = action.payload;
      })
      .addCase(createOrder.fulfilled, (state) => {
        state.currentStep = 5;
      })
      .addCase(fetchAvailableCoupons.fulfilled, (state, action) => {
        state.availableCoupons = action.payload;
      });
  },
});

export const {
  setCurrentStep,
  setShippingAddress,
  setShippingMethod,
  setPaymentMethod,
  removeCoupon,
  resetCheckout,
  nextStep,
  previousStep,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
