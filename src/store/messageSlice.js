import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMessages, sendMessage } from "../api/messageApi";

// ========================================
// 🔥 FETCH MESSAGES
// ========================================
export const fetchMessages = createAsyncThunk(
  "messages/fetchMessages",
  async ({ chatId, lastMessageId }, { rejectWithValue }) => {
    try {
      const res = await getMessages(chatId, lastMessageId);
      return { chatId, messages: res.data, isPagination: !!lastMessageId };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ========================================
// 🔥 SEND MESSAGE
// ========================================
export const sendMessageThunk = createAsyncThunk(
  "messages/sendMessage",
  async ({ chatId, text, file }, { rejectWithValue }) => {
    try {
      const res = await sendMessage({ chatId, text, file });
      return { chatId, message: res.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ========================================
// 🔥 SLICE
// ========================================
const messageSlice = createSlice({
  name: "messages",
  initialState: {
    messagesByChat: {}, // { chatId: [messages...] }
    loading: false,
    error: null,
  },
  reducers: {
    // ✅ Handle Real-Time Incoming Messages
    realtimeMessageReceived: (state, action) => {
      const message = action.payload;
      const chatId = message.chatId;

      if (!state.messagesByChat[chatId]) {
        state.messagesByChat[chatId] = [];
      }

      // Check if message already exists
      const existingIndex = state.messagesByChat[chatId].findIndex(
        (m) => m.$id === message.$id
      );

      if (existingIndex !== -1) {
        state.messagesByChat[chatId][existingIndex] = message;
      } else {
        state.messagesByChat[chatId].push(message);
      }
    },


  },
  extraReducers: (builder) => {
    builder
      // ================= FETCH =================
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { chatId, messages, isPagination } = action.payload;

        if (!state.messagesByChat[chatId]) {
          state.messagesByChat[chatId] = [];
        }

        if (isPagination) {
          // Prepend older messages
          state.messagesByChat[chatId] = [...messages, ...state.messagesByChat[chatId]];
        } else {
          state.messagesByChat[chatId] = messages;
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= SEND MESSAGE =================
      .addCase(sendMessageThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendMessageThunk.fulfilled, (state, action) => {
        state.loading = false;
        const { chatId, message } = action.payload;
        if (!state.messagesByChat[chatId]) {
          state.messagesByChat[chatId] = [];
        }
        
        const index = state.messagesByChat[chatId].findIndex((m) => m.$id === message.$id);
        if (index === -1) {
          state.messagesByChat[chatId].push(message);
        }
      })
      .addCase(sendMessageThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { realtimeMessageReceived } = messageSlice.actions;
export default messageSlice.reducer;
