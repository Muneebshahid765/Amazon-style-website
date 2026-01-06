import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'light',
  isSidebarOpen: false,
  isCartOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    toggleSidebar(state) {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    toggleCart(state) {
      state.isCartOpen = !state.isCartOpen;
    },
    closeOverlays(state) {
      state.isSidebarOpen = false;
      state.isCartOpen = false;
    },
  },
});

export const { toggleTheme, toggleSidebar, toggleCart, closeOverlays } = uiSlice.actions;
export default uiSlice.reducer;
