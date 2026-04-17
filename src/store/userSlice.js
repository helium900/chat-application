import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createUser,
  setUsername,
  getUserById,
} from "../api/userApi";
import {
  uploadAvatar,
  deleteAvatar,
} from "../api/avatarApi";


// ========================================
// 🔥 FETCH USER
// ========================================
export const fetchUser = createAsyncThunk(
  "users/fetchUser",
  async (userId) => {
    const user = await getUserById(userId);

    return {
      userId: user.$id,
      username: user.username,
      avatarFileID: user.avatarFileID,
      email: user.email,
    };
  }
);



// ========================================
// 🔥 SET USERNAME
// ========================================
export const setUsernameThunk = createAsyncThunk(
  "users/setUsername",
  async ({ userId, username }, { rejectWithValue }) => {
    try {
      const res = await setUsername(userId, username);

      return {
        userId,
        username: res.username,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


// ========================================
// 🔥 UPLOAD AVATAR
// ========================================
export const uploadAvatarThunk = createAsyncThunk(
  "users/uploadAvatar",
  async ({ file, userId, oldFileId }, { rejectWithValue }) => {
    const res = await uploadAvatar(file, userId, oldFileId);

    if (res.error) {
      return rejectWithValue(res.error);
    }

    return {
      userId,
      avatarFileID: res.data,
    };
  }
);


// ========================================
// 🔥 DELETE AVATAR
// ========================================
export const deleteAvatarThunk = createAsyncThunk(
  "users/deleteAvatar",
  async ({ userId, fileId }, { rejectWithValue }) => {
    const res = await deleteAvatar(userId, fileId);

    if (res.error) {
      return rejectWithValue(res.error);
    }

    return {
      userId
    };
  }
);


// ========================================
// 🔥 SLICE
// ========================================
const userSlice = createSlice({
  name: "users",
  initialState: {
    users: {}, // { userId: { username, avatarFileID, email } }
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {

    // ================= FETCH =================
    builder.addCase(fetchUser.fulfilled, (state, action) => {
      const { userId, username, avatarFileID, email } = action.payload;

      state.users[userId] = {
        username,
        avatarFileID,
        email,
      };
    });

    // ================= USERNAME =================
    builder.addCase(setUsernameThunk.fulfilled, (state, action) => {
      const { userId, username } = action.payload;

      if (state.users[userId]) {
        state.users[userId].username = username;
      }
    });

    builder.addCase(setUsernameThunk.rejected, (state, action) => {
      state.error = action.payload;
    });

    // ================= AVATAR =================
    builder.addCase(uploadAvatarThunk.fulfilled, (state, action) => {
      const { userId, avatarFileID } = action.payload;

      if (state.users[userId]) {
        state.users[userId].avatarFileID = avatarFileID;
      }
    });

    builder.addCase(deleteAvatarThunk.fulfilled, (state, action) => {
      const { userId } = action.payload;

      if (state.users[userId]) {
        state.users[userId].avatarFileID = null;
      }
    });
  },
});

export default userSlice.reducer;