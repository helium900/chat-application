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

      const existingIndex = state.messagesByChat[chatId].findIndex(
        (m) => m.$id === message.$id
      );

      if (existingIndex !== -1) {
        state.messagesByChat[chatId][existingIndex] = message;
      } else {
        state.messagesByChat[chatId].push(message);
      }

      // 🛡️ Ensure messages are always sorted by date to fix out-of-order issues
      state.messagesByChat[chatId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ================= FETCH =================
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const { chatId, messages, isPagination } = action.payload;

        if (!state.messagesByChat[chatId]) {
          state.messagesByChat[chatId] = [];
        }

        if (isPagination) {
          state.messagesByChat[chatId] = [...messages, ...state.messagesByChat[chatId]];
        } else {
          state.messagesByChat[chatId] = messages;
        }

        // 🛡️ Global Sort
        state.messagesByChat[chatId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || "Failed to fetch messages";
      })

      // ================= SEND MESSAGE =================
      .addCase(sendMessageThunk.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        const { chatId, text, file } = action.meta.arg;

        // Optimistic Message
        const tempId = `temp-${Date.now()}`;
        if (!state.messagesByChat[chatId]) {
          state.messagesByChat[chatId] = [];
        }
        state.messagesByChat[chatId].push({
          $id: tempId,
          chatId,
          text,
          file, // ⚠️ Storing File object temporarily for Resend
          type: file ? "file" : "text",
          status: "sending",
          createdAt: new Date().toISOString(),
          senderId: "me",
        });
      })
      .addCase(sendMessageThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const { chatId, message } = action.payload;

        // Replace temp message or add if not found
        if (state.messagesByChat[chatId]) {
          const tempIndex = state.messagesByChat[chatId].findIndex(m => m.status === "sending" && m.text === message.text);
          if (tempIndex !== -1) {
            state.messagesByChat[chatId][tempIndex] = message;
          } else {
            state.messagesByChat[chatId].push(message);
          }
          // 🛡️ Global Sort
          state.messagesByChat[chatId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
      })
      .addCase(sendMessageThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || "Failed to send message";
        const { chatId } = action.meta.arg;

        // Mark optimistic message as failed
        if (state.messagesByChat[chatId]) {
          const tempIndex = state.messagesByChat[chatId].findLastIndex(m => m.status === "sending");
          if (tempIndex !== -1) {
            state.messagesByChat[chatId][tempIndex].status = "failed";
          }
        }
      });
  },
});

export const { realtimeMessageReceived, clearError } = messageSlice.actions;
export default messageSlice.reducer;
