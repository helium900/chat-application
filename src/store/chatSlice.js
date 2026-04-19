import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchUser } from "./userSlice";
import { getChatsFromDB, saveChatsToDB } from "../utils/indexedDB";

import {
  getUserChats,
  toggleBlockChat,
  togglePinChat,
  deleteChatForMe,
  createChat as apiCreateChat,
} from "../api/chatApi";




// ========================================
// 🔥 FETCH CHATS
// ========================================
export const fetchChats = createAsyncThunk(
  "chats/fetchChats",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const localChats = await getChatsFromDB("default");
      if (localChats && localChats.length > 0) {
        dispatch(chatSlice.actions.setCachedChats(localChats));
      }

      const res = await getUserChats();
      
      // Extract all unique user IDs from all chats
      const userIds = new Set();
      res.forEach(chat => {
        (chat.members || []).forEach(id => userIds.add(id));
      });
      
      // Dispatch fetchUser for each unique user so we have their avatars
      userIds.forEach(id => dispatch(fetchUser(id)));
      
      await saveChatsToDB("default", res);

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
// ✅ CREATE CHAT
// ========================================
export const startNewChat = createAsyncThunk(
  "chats/startNewChat",
  async (otherUserId, { rejectWithValue }) => {
    try {
      const res = await apiCreateChat(otherUserId);
      return res;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to start chat");
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
    actionLoading: false,
    backups: {},
    activeChatId: null,
  },


  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setActiveChat: (state, action) => {
      state.activeChatId = action.payload;
    },

    setCachedChats: (state, action) => {
      // Only set if we haven't loaded network data yet
      if (state.chats.length === 0) {
        state.chats = action.payload;
      }
    },
    realtimeChatReceived: (state, action) => {
      const chat = action.payload;
      const index = state.chats.findIndex((c) => c.$id === chat.$id);
      if (index !== -1) {
        state.chats[index] = chat;
      } else {
        state.chats.unshift(chat);
      }
      // Re-sort chats by updatedAt
      state.chats.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
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

    // ================= CREATE =================
    builder
      .addCase(startNewChat.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(startNewChat.fulfilled, (state, action) => {
        state.actionLoading = false;
        const newChat = action.payload;
        // Check if chat already exists in list (avoid duplicates)
        const exists = state.chats.find((c) => c.$id === newChat.$id);
        if (!exists) {
          state.chats.unshift(newChat);
        }
      })
      .addCase(startNewChat.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || action.error.message;
      });

  },
});


export const { clearError, setCachedChats, realtimeChatReceived, setActiveChat } = chatSlice.actions;

export default chatSlice.reducer;