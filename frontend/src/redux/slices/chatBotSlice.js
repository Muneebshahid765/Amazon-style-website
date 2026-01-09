import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getChatSession = createAsyncThunk(
  'chatBot/getSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/chatbot/session`, {
        withCredentials: true
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load chat session');
    }
  }
);

export const getUserContext = createAsyncThunk(
  'chatBot/getContext',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/chatbot/context`, {
        withCredentials: true
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load context');
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  'chatBot/sendMessage',
  async ({ message, sessionId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/chatbot/message`,
        { message, sessionId },
        { withCredentials: true }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const setChatUserType = createAsyncThunk(
  'chatBot/setUserType',
  async ({ userType, sessionId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/chatbot/user-type`,
        { userType, sessionId },
        { withCredentials: true }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to set user type');
    }
  }
);

export const updateChatLanguage = createAsyncThunk(
  'chatBot/updateLanguage',
  async ({ language, sessionId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/chatbot/language`,
        { language, sessionId },
        { withCredentials: true }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update language');
    }
  }
);

export const clearChat = createAsyncThunk(
  'chatBot/clear',
  async ({ sessionId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/chatbot/clear`,
        { sessionId },
        { withCredentials: true }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear chat');
    }
  }
);

const initialState = {
  sessionId: null,
  messages: [],
  userType: null,
  language: 'english',
  contextData: null,
  isOpen: false,
  loading: false,
  error: null,
  sendingMessage: false
};

const chatBotSlice = createSlice({
  name: 'chatBot',
  initialState,
  reducers: {
    toggleChatBot: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeChatBot: (state) => {
      state.isOpen = false;
    },
    openChatBot: (state) => {
      state.isOpen = true;
    },
    addLocalMessage: (state, action) => {
      state.messages.push({
        id: Date.now(),
        text: action.payload.text,
        sender: action.payload.sender,
        timestamp: new Date().toISOString()
      });
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getChatSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getChatSession.fulfilled, (state, action) => {
        state.loading = false;
        state.sessionId = action.payload.sessionId;
        state.messages = action.payload.messages || [];
        state.userType = action.payload.userType;
        state.language = action.payload.language || 'english';
      })
      .addCase(getChatSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getUserContext.fulfilled, (state, action) => {
        state.contextData = action.payload;
      })
      .addCase(getUserContext.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(sendChatMessage.pending, (state) => {
        state.sendingMessage = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        state.messages.push({
          id: Date.now(),
          text: action.payload.message,
          sender: 'bot',
          timestamp: new Date().toISOString()
        });
        if (action.payload.userType !== undefined) {
          state.userType = action.payload.userType;
        }
        if (action.payload.language) {
          state.language = action.payload.language;
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.payload;
      })
      .addCase(setChatUserType.fulfilled, (state, action) => {
        state.userType = action.payload.userType;
        state.messages.push({
          id: Date.now(),
          text: action.payload.message,
          sender: 'bot',
          timestamp: new Date().toISOString()
        });
      })
      .addCase(setChatUserType.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateChatLanguage.fulfilled, (state, action) => {
        state.language = action.payload.language;
        state.messages.push({
          id: Date.now(),
          text: action.payload.message,
          sender: 'bot',
          timestamp: new Date().toISOString()
        });
      })
      .addCase(updateChatLanguage.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(clearChat.fulfilled, (state, action) => {
        state.messages = action.payload.messages || [];
        state.userType = null;
      })
      .addCase(clearChat.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { 
  toggleChatBot, 
  closeChatBot, 
  openChatBot, 
  addLocalMessage,
  clearError 
} = chatBotSlice.actions;

export default chatBotSlice.reducer;
