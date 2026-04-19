import { subscribeToMessages, subscribeToAllMessages } from "../api/messageApi";
import { realtimeMessageReceived } from "./messageSlice";

import { store } from "./store";
import { account } from "../appwriteConfig";

let unsubscribe = null;
let unsubscribeGlobal = null;
let cachedUserId = null;

export const setCurrentUserIdForListener = (id) => {
  cachedUserId = id;
};

export const startMessageListener = (chatId, dispatch) => {
  if (unsubscribe) {
    unsubscribe();
  }

  unsubscribe = subscribeToMessages(chatId, (message) => {
    dispatch(realtimeMessageReceived(message));
  });
};

export const startGlobalMessageListener = (dispatch) => {
  if (unsubscribeGlobal) {
    unsubscribeGlobal();
  }

  unsubscribeGlobal = subscribeToAllMessages((message) => {
   
    dispatch(realtimeMessageReceived(message));
  });

};


export const stopMessageListener = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};

export const stopGlobalMessageListener = () => {
  if (unsubscribeGlobal) {
    unsubscribeGlobal();
    unsubscribeGlobal = null;
  }
};
