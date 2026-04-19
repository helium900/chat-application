// api/chatApi.js
import { databases, account, client } from "../appwriteConfig";
import { Query, ID, Permission, Role } from "appwrite";

const DB_ID = "69d0f31d001e2eeda01b";
const CHAT_COLLECTION = "chats";


// ========================================
// ✅ CREATE CHAT (WITH DUPLICATE CHECK)
// ========================================
export const createChat = async (otherUserId) => {
  try {
    const user = await account.get();
    const currentUserId = user.$id;

    if (currentUserId === otherUserId) {
      throw new Error("You cannot chat with yourself");
    }

    // 🔍 1. Check if chat already exists
    // Fallback: Get ALL chats and filter in JS if contains query fails
    let existingDocs = [];
    try {
      const existing = await databases.listDocuments(DB_ID, CHAT_COLLECTION, [
        Query.contains("members", currentUserId),
        Query.contains("members", otherUserId),
      ]);
      existingDocs = existing.documents;
    } catch (err) {
      console.warn("Index-based search failed, falling back to manual filter", err.message);
      const all = await databases.listDocuments(DB_ID, CHAT_COLLECTION, [
        Query.limit(100)
      ]);
      existingDocs = all.documents;
    }

    const exactChat = existingDocs.find(
      (doc) => doc.members.length === 2 &&
        doc.members.includes(currentUserId) &&
        doc.members.includes(otherUserId)
    );

    if (exactChat) {
      if ((exactChat.hiddenFor || []).includes(currentUserId)) {
        const newHidden = exactChat.hiddenFor.filter(id => id !== currentUserId);
        return await databases.updateDocument(DB_ID, CHAT_COLLECTION, exactChat.$id, {
          hiddenFor: newHidden
        });
      }
      return exactChat;
    }

    // 🚀 2. Create new chat if not exists
    const members = [currentUserId, otherUserId];

    return await databases.createDocument(
      DB_ID,
      CHAT_COLLECTION,
      ID.unique(),
      {
        members,
        hiddenFor: [],
        pinnedBy: [],
        blockedUsers: [],
        updatedAt: new Date().toISOString()
      }
    );
  } catch (err) {
    throw new Error(err.message || "Create chat failed");
  }
};


// ========================================
// ✅ GET USER CHATS (RELIABLE FALLBACK)
// ========================================
export const getUserChats = async () => {
  try {
    const user = await account.get();
    const userId = user.$id;

    let documents = [];
    try {
      // Try index-based query first
      const response = await databases.listDocuments(DB_ID, CHAT_COLLECTION, [
        Query.contains("members", userId),
      ]);
      documents = response.documents;
    } catch (err) {
      console.warn("Index for 'members' missing, fetching all chats and filtering in JS", err.message);
      // Fallback: Fetch all chats (limited) and filter
      const response = await databases.listDocuments(DB_ID, CHAT_COLLECTION, [
        Query.limit(100)
      ]);
      documents = response.documents.filter(doc => doc.members.includes(userId));
    }

    // Filter hidden and sort manually in JS to avoid index requirement
    return documents
      .filter(chat => !(chat.hiddenFor || []).includes(userId))
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

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
    throw new Error(err.message || "Delete chat failed");
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

    let updatedPinned;
    if ((chat.pinnedBy || []).includes(userId)) {
      updatedPinned = chat.pinnedBy.filter((id) => id !== userId);
    } else {
      updatedPinned = Array.from(new Set([...(chat.pinnedBy || []), userId]));
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

    let updatedBlocked;
    if ((chat.blockedUsers || []).includes(userId)) {
      updatedBlocked = chat.blockedUsers.filter((id) => id !== userId);
    } else {
      updatedBlocked = Array.from(new Set([...(chat.blockedUsers || []), userId]));
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

// ========================================
// ✅ REAL-TIME SUBSCRIPTION
// ========================================
export const subscribeToChats = (userId, callback) => {
  const unsubscribe = client.subscribe(
    `databases.${DB_ID}.collections.${CHAT_COLLECTION}.documents`,
    (response) => {
      const chat = response.payload;
      if (
        (response.events.includes("databases.*.collections.*.documents.*.create") ||
         response.events.includes("databases.*.collections.*.documents.*.update")) &&
        chat.members.includes(userId)
      ) {
        callback(chat);
      }
    }
  );

  return unsubscribe;
};