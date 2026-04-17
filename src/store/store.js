import { configureStore } from "@reduxjs/toolkit";

import userReducer from "./userSlice";
import chatReducer from "./chatSlice";
import presenceReducer from "./presenceSlice";
import messageReducer from "./messageSlice";

export const store = configureStore({
  reducer: {
    users: userReducer,
    chats: chatReducer,
    presence: presenceReducer,
    messages: messageReducer,
  },
});