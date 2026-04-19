import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMessages, sendMessage } from "../api/messageApi";


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


const messageSlice = createSlice({
  name: "messages",
  initialState: {
    messagesByChat: {},
    loading: false,
    error: null,
  },
  reducers: {
 
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

     
      state.messagesByChat[chatId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
     
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

     
        state.messagesByChat[chatId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || "Failed to fetch messages";
      })

    
      .addCase(sendMessageThunk.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        const { chatId, text, file } = action.meta.arg;

       
        const tempId = `temp-${Date.now()}`;
        if (!state.messagesByChat[chatId]) {
          state.messagesByChat[chatId] = [];
        }
        state.messagesByChat[chatId].push({
          $id: tempId,
          chatId,
          text,
          file, 
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

       
        if (state.messagesByChat[chatId]) {
          const tempIndex = state.messagesByChat[chatId].findIndex(m => m.status === "sending" && m.text === message.text);
          if (tempIndex !== -1) {
            state.messagesByChat[chatId][tempIndex] = message;
          } else {
            state.messagesByChat[chatId].push(message);
          }
        
          state.messagesByChat[chatId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
      })
      .addCase(sendMessageThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || "Failed to send message";
        const { chatId } = action.meta.arg;

     
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
