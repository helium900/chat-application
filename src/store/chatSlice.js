import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  getUserChats,
  toggleBlockChat,
  togglePinChat,
  deleteChatForMe,
} from "../api/chatApi";


// ========================================
// 🔥 FETCH CHATS
// ========================================
export const fetchChats = createAsyncThunk(
  "chats/fetchChats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getUserChats();
      return res; // res is now already the sorted array
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch chats");
    }
  }
);


// ========================================
// 📌 TOGGLE PIN
// ========================================
export const togglePin = createAsyncThunk(
  "chats/togglePin",
  async (chatId, { rejectWithValue }) => {
    try {
      const updatedChat = await togglePinChat(chatId);
      return updatedChat;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to toggle pin");
    }
  }
);


// ========================================
// 🚫 TOGGLE BLOCK
// ========================================
export const toggleBlock = createAsyncThunk(
  "chats/toggleBlock",
  async (chatId, { rejectWithValue }) => {
    try {
      const updatedChat = await toggleBlockChat(chatId);
      return updatedChat;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to toggle block");
    }
  }
);


// ========================================
// 🗑 DELETE FOR ME
// ========================================
export const deleteForMe = createAsyncThunk(
  "chats/deleteForMe",
  async (chatId, { rejectWithValue }) => {
    try {
      const updatedChat = await deleteChatForMe(chatId);
      return updatedChat;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete chat for me");
    }
  }
);


// ========================================
// 🔥 SLICE
// ========================================
const chatSlice = createSlice({
  name: "chats",
  initialState: {
    chats: [],
    loading: false,
    actionLoading: false, // for pin/block/delete
    error: null,
    backups: {}, // 🔄 Stores backups for optimistic UI rollbacks
  },

  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {

    // ================= FETCH =================
    builder
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });

    // ================= PIN =================
    builder
      .addCase(togglePin.pending, (state, action) => {
        state.actionLoading = true;
        state.error = null;
        const chatId = action.meta.arg;

        // 🔄 Backup for rollback
        const chatToBackup = state.chats.find((c) => c.$id === chatId);
        if (chatToBackup) {
          state.backups[chatId] = chatToBackup;
        }
        // Note: Full optimistic update of pinnedBy requires userId, which isn't in slice state.
      })
      .addCase(togglePin.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updatedChat = action.payload;
        const chatId = action.meta.arg;

        // ✅ Success: Remove backup
        delete state.backups[chatId];

        state.chats = state.chats.map((chat) =>
          chat.$id === updatedChat.$id ? updatedChat : chat
        );
      })
      .addCase(togglePin.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || action.error.message;
        const chatId = action.meta.arg;

        // ⏪ Rollback
        if (state.backups[chatId]) {
          state.chats = state.chats.map((chat) =>
            chat.$id === chatId ? state.backups[chatId] : chat
          );
          delete state.backups[chatId];
        }
      });

    // ================= BLOCK =================
    builder
      .addCase(toggleBlock.pending, (state, action) => {
        state.actionLoading = true;
        state.error = null;
        const chatId = action.meta.arg;

        // 🔄 Backup for rollback
        const chatToBackup = state.chats.find((c) => c.$id === chatId);
        if (chatToBackup) {
          state.backups[chatId] = chatToBackup;
        }
      })
      .addCase(toggleBlock.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updatedChat = action.payload;
        const chatId = action.meta.arg;

        // ✅ Success: Remove backup
        delete state.backups[chatId];

        state.chats = state.chats.map((chat) =>
          chat.$id === updatedChat.$id ? updatedChat : chat
        );
      })
      .addCase(toggleBlock.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || action.error.message;
        const chatId = action.meta.arg;

        // ⏪ Rollback
        if (state.backups[chatId]) {
          state.chats = state.chats.map((chat) =>
            chat.$id === chatId ? state.backups[chatId] : chat
          );
          delete state.backups[chatId];
        }
      });

    // ================= DELETE FOR ME =================
    builder
      .addCase(deleteForMe.pending, (state, action) => {
        state.actionLoading = true;
        state.error = null;
        const chatId = action.meta.arg;

        // 🔄 Optimistic Update: Backup & Remove
        const chatToBackup = state.chats.find((c) => c.$id === chatId);
        if (chatToBackup) {
          state.backups[chatId] = chatToBackup;
        }
        state.chats = state.chats.filter((chat) => chat.$id !== chatId);
      })
      .addCase(deleteForMe.fulfilled, (state, action) => {
        state.actionLoading = false;
        const chatId = action.meta.arg;

        // ✅ Success: Remove backup
        delete state.backups[chatId];
        
        // Already filtered in pending, but we can ensure it's removed
        state.chats = state.chats.filter((chat) => chat.$id !== chatId);
      })
      .addCase(deleteForMe.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || action.error.message;
        const chatId = action.meta.arg;

        // ⏪ Rollback
        if (state.backups[chatId]) {
          state.chats.push(state.backups[chatId]);
          delete state.backups[chatId];
        }
      });

}});

export const { clearError } = chatSlice.actions;
export default chatSlice.reducer;