import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import productReducer from './slices/productSlice.js';
import cartReducer from './slices/cartSlice.js';
import uiReducer from './slices/uiSlice.js';
import userReducer from './slices/userSlice.js';
import checkoutReducer from './slices/checkoutSlice.js';
import registrationReducer from './slices/registrationSlice.js';
import adminReducer from './slices/adminSlice.js';
import sellerReducer from './slices/sellerSlice.js';

const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    cart: cartReducer,
    ui: uiReducer,
    user: userReducer,
    checkout: checkoutReducer,
    registration: registrationReducer,
    admin: adminReducer,
    seller: sellerReducer,
  },
});

export default store;
