import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

const initialState = {
  items: [],
  loading: false,
  error: null,
  unreadCount: 0,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalNotifications: 0,
    limit: 10,
  },
  lastFetchedAt: null,
};

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  return query.toString() ? `?${query.toString()}` : '';
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = buildQueryString({
        page: params.page || 1,
        limit: params.limit || 10,
        type: params.type,
        unreadOnly: params.unreadOnly,
      });

      const { data } = await api.get(`/notifications${queryString}`);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Notifications load nahi ho saken';
      return rejectWithValue(message);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markRead',
  async ({ id }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/notifications/${id}/read`);
      return data.notification;
    } catch (error) {
      const message = error.response?.data?.message || 'Notification mark read nahi ho saki';
      return rejectWithValue(message);
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await api.put('/notifications/read-all');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Sab notifications mark read nahi ho saken';
      return rejectWithValue(message);
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteOne',
  async ({ id }, { rejectWithValue }) => {
    try {
      await api.delete(`/notifications/${id}`);
      return id;
    } catch (error) {
      const message = error.response?.data?.message || 'Notification delete nahi ho saki';
      return rejectWithValue(message);
    }
  }
);

export const clearAllNotifications = createAsyncThunk(
  'notifications/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      await api.delete('/notifications');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Notifications clear nahi ho saken';
      return rejectWithValue(message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const fetchedNotifications = action.payload.notifications || [];
        const shouldAppend = action.meta?.arg?.append;
        if (shouldAppend) {
          const existingIds = new Set(state.items.map((item) => item._id));
          const merged = [
            ...state.items,
            ...fetchedNotifications.filter((item) => !existingIds.has(item._id)),
          ];
          state.items = merged;
        } else {
          state.items = fetchedNotifications;
        }
        state.unreadCount = action.payload.unreadCount || 0;
        state.pagination = {
          currentPage: action.payload.currentPage || (shouldAppend ? state.pagination.currentPage : 1),
          totalPages: action.payload.totalPages || 1,
          totalNotifications: action.payload.totalNotifications || state.items.length,
          limit: action.meta.arg?.limit || state.pagination.limit,
        };
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.items = state.items.map((notification) =>
          notification._id === action.payload?._id
            ? { ...notification, readAt: action.payload.readAt || new Date().toISOString() }
            : notification
        );
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.items = state.items.map((notification) => ({
          ...notification,
          readAt: notification.readAt || new Date().toISOString(),
        }));
        state.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notificationToDelete = state.items.find((item) => item._id === action.payload);
        state.items = state.items.filter((item) => item._id !== action.payload);
        if (notificationToDelete && !notificationToDelete.readAt) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.items = [];
        state.unreadCount = 0;
        state.pagination = { ...state.pagination, totalNotifications: 0 };
      })
      .addMatcher(
        (action) =>
          [markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearAllNotifications].some(
            (thunk) => thunk.rejected.match(action)
          ),
        (state, action) => {
          state.error = action.payload;
        }
      );
  },
});

export default notificationSlice.reducer;
