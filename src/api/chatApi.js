// api/chatApi.js
import { databases, account } from "./appwriteConfig";
import { Query, ID } from "appwrite";

const DB_ID = "chat-db";
const CHAT_COLLECTION = "chats";


// ========================================
// ✅ CREATE CHAT
// ========================================
export const createChat = async (otherUserId) => {
  try {
    const user = await account.get();

    const members = [user.$id, otherUserId];

    return await databases.createDocument(
      DB_ID,
      CHAT_COLLECTION,
      ID.unique(),
      {
        members,
        pinnedBy: [],
        hiddenFor: [],
        blockedUsers: [],
        updatedAt: new Date().toISOString(),
      }
    );
  } catch (err) {
    throw new Error(err.message || "Create chat failed");
  }
};


// ========================================
// ✅ GET USER CHATS
// ========================================
export const getUserChats = async () => {
  try {
    const user = await account.get();

    const response = await databases.listDocuments(DB_ID, CHAT_COLLECTION, [
      Query.equal("members", user.$id),
      Query.notEqual("hiddenFor", user.$id),
      Query.orderDesc("updatedAt"),
    ]);

    // 🔥 Sort pinned chats to top (post-fetch, since Appwrite can't sort by array inclusion)
    const sortedDocs = response.documents.sort((a, b) => {
      const aPinned = a.pinnedBy?.includes(user.$id) ? 1 : 0;
      const bPinned = b.pinnedBy?.includes(user.$id) ? 1 : 0;
      return bPinned - aPinned;
    });

    return sortedDocs;
  } catch (err) {
    throw new Error(err.message || "Get chats failed");
  }
};


// ========================================
// ✅ DELETE CHAT FOR ME (HIDE)
// ========================================
export const deleteChatForMe = async (chatId) => {
  try {
    const user = await account.get();
    const userId = user.$id;

    const chat = await databases.getDocument(
      DB_ID,
      CHAT_COLLECTION,
      chatId
    );

    if (!chat.members.includes(userId)) {
      throw new Error("Not authorized");
    }

    const updatedHidden = Array.from(
      new Set([...(chat.hiddenFor || []), userId])
    );

    return await databases.updateDocument(
      DB_ID,
      CHAT_COLLECTION,
      chatId,
      {
        hiddenFor: updatedHidden,
      }
    );
  } catch (err) {
    throw new Error(err.message || "Delete chat (me) failed");
  }
};



// ========================================
// 📌 TOGGLE PIN CHAT
// ========================================
export const togglePinChat = async (chatId) => {
  try {
    const user = await account.get();
    const userId = user.$id;

    const chat = await databases.getDocument(
      DB_ID,
      CHAT_COLLECTION,
      chatId
    );

    if (!chat.members.includes(userId)) {
      throw new Error("Not authorized");
    }

    let updatedPinned;

    if ((chat.pinnedBy || []).includes(userId)) {
      // ❌ UNPIN
      updatedPinned = chat.pinnedBy.filter((id) => id !== userId);
    } else {
      // ✅ PIN
      updatedPinned = Array.from(
        new Set([...(chat.pinnedBy || []), userId])
      );
    }

    return await databases.updateDocument(
      DB_ID,
      CHAT_COLLECTION,
      chatId,
      {
        pinnedBy: updatedPinned,
      }
    );
  } catch (err) {
    throw new Error(err.message || "Pin toggle failed");
  }
};


// ========================================
// 🚫 TOGGLE BLOCK CHAT
// ========================================
export const toggleBlockChat = async (chatId) => {
  try {
    const user = await account.get();
    const userId = user.$id;

    const chat = await databases.getDocument(
      DB_ID,
      CHAT_COLLECTION,
      chatId
    );

    if (!chat.members.includes(userId)) {
      throw new Error("Not authorized");
    }

    let updatedBlocked;

    if ((chat.blockedUsers || []).includes(userId)) {
      // ❌ UNBLOCK
      updatedBlocked = chat.blockedUsers.filter((id) => id !== userId);
    } else {
      // ✅ BLOCK
      updatedBlocked = Array.from(
        new Set([...(chat.blockedUsers || []), userId])
      );
    }

    return await databases.updateDocument(
      DB_ID,
      CHAT_COLLECTION,
      chatId,
      {
        blockedUsers: updatedBlocked,
      }
    );
  } catch (err) {
    throw new Error(err.message || "Block toggle failed");
  }
};