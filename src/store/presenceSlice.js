import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { subscribeToPresence, getUserStatus } from "../presence/presence";

let unsubscribePresence = null;
let reEvaluateInterval = null;

// ========================================
// 🔥 START LISTENER
// ========================================
export const startPresenceListener = createAsyncThunk(
  "presence/startListener",
  async (_, { dispatch }) => {
    if (unsubscribePresence) {
      unsubscribePresence();
    }
    if (reEvaluateInterval) {
      clearInterval(reEvaluateInterval);
    }

    unsubscribePresence = subscribeToPresence((user) => {
      const status = getUserStatus(user.lastSeen);

      dispatch(updateUserStatus({
        userId: user.$id,
        status,
        lastSeen: user.lastSeen
      }));
    });

    // Periodically re-evaluate statuses to catch users who went offline
    reEvaluateInterval = setInterval(() => {
      dispatch(reEvaluatePresence());
    }, 10000); // Check every 10s

    return true;
  }
);

export const stopPresenceListener = createAsyncThunk(
  "presence/stopListener",
  async (_, { dispatch }) => {
    if (unsubscribePresence) {
      unsubscribePresence();
      unsubscribePresence = null;
    }
    if (reEvaluateInterval) {
      clearInterval(reEvaluateInterval);
      reEvaluateInterval = null;
    }
    dispatch(clearPresence());
    return true;
  }
);

const presenceSlice = createSlice({
  name: "presence",
  initialState: {
    lastSeenMap: {}, // { userId: timestamp }
    onlineUsers: {}, // { userId: "online" | "offline" | "active" }
    isSubscribed: false,
  },
  reducers: {
    updateUserStatus: (state, action) => {
      const { userId, status, lastSeen } = action.payload;
      state.onlineUsers[userId] = status;
      if (lastSeen) {
        state.lastSeenMap[userId] = lastSeen;
      }
    },
    
    reEvaluatePresence: (state) => {
      for (const [userId, lastSeen] of Object.entries(state.lastSeenMap)) {
        const status = getUserStatus(lastSeen);
        
        if (state.onlineUsers[userId] !== status) {
          state.onlineUsers[userId] = status;
        }
      }
    },

    clearPresence: (state) => {
      if (unsubscribePresence) {
        unsubscribePresence();
        unsubscribePresence = null;
      }
      state.onlineUsers = {};
      state.lastSeenMap = {};
      state.isSubscribed = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(startPresenceListener.fulfilled, (state) => {
      state.isSubscribed = true;
    });

    // ✅ Initialize presence when users are fetched from DB
    builder.addCase("users/fetchUser/fulfilled", (state, action) => {
      const { userId, lastSeen } = action.payload;
      if (userId && lastSeen) {
        state.lastSeenMap[userId] = lastSeen;
        
        state.onlineUsers[userId] = getUserStatus(lastSeen);
      }
    });
  },
});

export const { updateUserStatus, clearPresence, reEvaluatePresence } = presenceSlice.actions;
export default presenceSlice.reducer;