import { subscribeToMessages } from "../api/messageApi";
import { realtimeMessageReceived } from "./messageSlice";

let unsubscribe = null;

export const startMessageListener = (chatId, dispatch) => {
  // If there's an existing subscription, unsubscribe first to avoid duplicates
  if (unsubscribe) {
    unsubscribe();
  }

  // Start new subscription for this chat
  unsubscribe = subscribeToMessages(chatId, (message) => {
    // Dispatch action to update Redux store
    dispatch(realtimeMessageReceived(message));
  });
};

export const stopMessageListener = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};
