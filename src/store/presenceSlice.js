import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { subscribeToPresence, getUserStatus } from "../presence/presence";

// ========================================
// 🔥 START LISTENER
// ========================================
export const startPresenceListener = createAsyncThunk(
  "presence/startListener",
  async (_, { dispatch }) => {
    const unsubscribe = subscribeToPresence((user) => {
      const status = getUserStatus(user.lastSeen);

      dispatch(updateUserStatus({
        userId: user.$id,
        status,
      }));
    });

    return unsubscribe;
  }
);

const presenceSlice = createSlice({
  name: "presence",
  initialState: {
    onlineUsers: {}, // { userId: status }
    unsubscribe: null,
    
  },
  reducers: {
    updateUserStatus: (state, action) => {
      const { userId, status } = action.payload;
      state.onlineUsers[userId] = status;
    },

    clearPresence: (state) => {
      if (state.unsubscribe) {
        state.unsubscribe();
      }
      state.onlineUsers = {};
      state.unsubscribe = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(startPresenceListener.fulfilled, (state, action) => {
      state.unsubscribe = action.payload;
    });
  },
});

export const { updateUserStatus, clearPresence } = presenceSlice.actions;
export default presenceSlice.reducer;