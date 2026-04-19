import { subscribeToChats } from "../api/chatApi";
import { realtimeChatReceived } from "./chatSlice";
import { fetchUser } from "./userSlice";

let unsubscribe = null;

export const startChatListener = (userId, dispatch) => {
  if (unsubscribe) {
    unsubscribe();
  }

  unsubscribe = subscribeToChats(userId, (chat) => {
    // If the chat was just deleted (hidden) by this user, ignore the real-time update
    if (chat.hiddenFor && chat.hiddenFor.includes(userId)) {
      return;
    }

    dispatch(realtimeChatReceived(chat));
    
    // Make sure we have the other user's info loaded (for avatar/username)
    chat.members.forEach(memberId => {
      if (memberId !== userId) {
        dispatch(fetchUser(memberId));
      }
    });
  });
};

export const stopChatListener = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};
