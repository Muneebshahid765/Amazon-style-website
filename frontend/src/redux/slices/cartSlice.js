import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';
import { toast } from 'react-toastify';

const initialState = {
  items: [],
  subtotal: 0,
  totalItems: 0,
  status: 'idle',
  error: null,
};

const calculateSubtotal = (items = []) => items.reduce((acc, item) => acc + item.price * item.quantity, 0);
const calculateTotalItems = (items = []) => items.reduce((acc, item) => acc + item.quantity, 0);

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users/cart');
    return data.cart;
  } catch (error) {
    // Don't reject if user is not authenticated - guest cart will be created on first add
    if (error.response?.status === 401) {
      return { items: [], subtotal: 0 };
    }
    return rejectWithValue(error.response?.data?.message || 'Unable to fetch cart');
  }
});

export const addToCart = createAsyncThunk(
  'cart/addItem',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/users/cart', { productId, quantity });
      toast.success('Added to cart');
      return data.cart;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add to cart';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateCartItemQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/users/cart', { productId, quantity });
      return data.cart;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update quantity';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeItem',
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/users/cart/${productId}`);
      toast.success('Removed from cart');
      return data.cart;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove item';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const clearCart = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.delete('/users/cart');
    toast.success('Cart cleared');
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to clear cart';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload?.items || [];
        state.subtotal = action.payload?.subtotal || calculateSubtotal(state.items);
        state.totalItems = calculateTotalItems(state.items);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload?.items || [];
        state.subtotal = action.payload?.subtotal || calculateSubtotal(state.items);
        state.totalItems = calculateTotalItems(state.items);
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.items = action.payload?.items || [];
        state.subtotal = action.payload?.subtotal || calculateSubtotal(state.items);
        state.totalItems = calculateTotalItems(state.items);
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload?.items || [];
        state.subtotal = action.payload?.subtotal || calculateSubtotal(state.items);
        state.totalItems = calculateTotalItems(state.items);
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.subtotal = 0;
        state.totalItems = 0;
      });
  },
});

export const { clearError } = cartSlice.actions;
export default cartSlice.reducer;
