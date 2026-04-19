// api/messageApi.js

import { databases, client, ID, account } from "../appwriteConfig";
import { Query, Permission, Role } from "appwrite";
import { uploadMedia, deleteMedia } from "./storageApi";

const DB_ID = "69d0f31d001e2eeda01b";
const MESSAGE_COLLECTION = "message";
const CHAT_COLLECTION = "chats";


// ========================================
// ✅ SEND MESSAGE (UPDATED FOR MEMBERS)
// ========================================
export const sendMessage = async ({
  chatId,
  text = "",
  file = null,
}) => {
  try {
    // 🔐 Get authenticated user
    if (!text && !file) {
      throw new Error("Message cannot be empty");
    }

    const user = await account.get();
    const senderId = user.$id;

    // 🔥 Get chat (to access members)
    const chat = await databases.getDocument(
      DB_ID,
      CHAT_COLLECTION,
      chatId
    );

    const members = chat.members || [];
    const blockedBy = chat.blockedUsers || [];

    // 🚫 BLOCK CHECK: If any other member has blocked the chat, sender is blocked.
    const isSenderBlocked = members.some(memberId => 
      memberId !== senderId && blockedBy.includes(memberId)
    );

    if (isSenderBlocked) {
      throw new Error("You cannot send messages to this user");
    }

    // Also prevent the person who blocked from sending (optional, but consistent with UI hiding)
    if (blockedBy.includes(senderId)) {
      throw new Error("You have blocked this user. Unblock to send messages.");
    }

    let fileUrl = "";
    let fileId = "";
    let type = "text";

    // 📁 Upload media with members (IMPORTANT FIX)
    if (file) {
      const fileRes = await uploadMedia({
        file,
        members, // ✅ FIXED (no receiverId)
      });

      fileUrl = fileRes.data.url; // ✅ FIXED (url not previewUrl)
      fileId = fileRes.data.fileId;
      type = fileRes.data.type;
    }

    const createdAt = new Date().toISOString();

    // 🔐 Set permissions for all members
    const permissions = members.map(id => Permission.read(Role.user(id)));
    // Allow sender to delete/update their own message
    permissions.push(Permission.update(Role.user(senderId)));
    permissions.push(Permission.delete(Role.user(senderId)));

    // 🧠 Create message
    const message = await databases.createDocument(
      DB_ID,
      MESSAGE_COLLECTION,
      ID.unique(),
      {
        chatId,
        senderId,
        type,
        text,
        fileUrl,
        fileId,
        createdAt,
        seenBy: [senderId],
        status: "sent",
        deleted: false,
      }
    );



    // 🔥 Update chat metadata (Fail gracefully if permissions are blocking)
    try {
      await databases.updateDocument(DB_ID, CHAT_COLLECTION, chatId, {
        updatedAt: createdAt,
        lastMessage: text || type,
      });
    } catch (updateErr) {
      console.warn("Could not update chat metadata, probably missing update permissions:", updateErr.message);
    }

    return { data: message };
  } catch (err) {
    throw new Error(err.message);
  }
};



// ========================================
// ✅ GET MESSAGES (NO CHANGE)
// ========================================
export const getMessages = async (chatId, lastMessageId = null) => {
  try {
    const queries = [
      Query.equal("chatId", chatId),
      Query.orderDesc("createdAt"),
      Query.limit(50),
    ];

    if (lastMessageId) {
      queries.push(Query.cursorAfter(lastMessageId));
    }

    const res = await databases.listDocuments(
      DB_ID,
      MESSAGE_COLLECTION,
      queries
    );

    return { data: res.documents.reverse() };
  } catch (err) {
    throw new Error(err.message);
  }
};



// ========================================
// ✅ REAL-TIME SUBSCRIPTION (NO CHANGE)
// ========================================
export const subscribeToMessages = (chatId, callback) => {
  const unsubscribe = client.subscribe(
    `databases.${DB_ID}.collections.${MESSAGE_COLLECTION}.documents`,
    (response) => {
      const message = response.payload;

      if (
        response.events.includes(
          "databases.*.collections.*.documents.*.create"
        ) &&
        message.chatId === chatId
      ) {
        callback(message);
      }
    }
  );

  return unsubscribe;
};

// Listen to all messages in the collection (for global unread counts)
export const subscribeToAllMessages = (callback) => {
  const unsubscribe = client.subscribe(
    `databases.${DB_ID}.collections.${MESSAGE_COLLECTION}.documents`,
    (response) => {
      const message = response.payload;

      if (
        response.events.includes(
          "databases.*.collections.*.documents.*.create"
        )
      ) {
        callback(message);
      }
    }
  );

  return unsubscribe;
};



// ========================================
// ✅ DELETE MESSAGE (NO CHANGE)
// ========================================
export const deleteMessage = async (messageId) => {
  try {
    const user = await account.get();
    const userId = user.$id;

    const msg = await databases.getDocument(
      DB_ID,
      MESSAGE_COLLECTION,
      messageId
    );

    if (msg.senderId !== userId) {
      throw new Error("Not allowed");
    }

    if (msg.fileId) {
      await deleteMedia(msg.fileId);
    }

    await databases.updateDocument(
      DB_ID,
      MESSAGE_COLLECTION,
      messageId,
      {
        deleted: true,
        text: "This message was deleted",
        fileUrl: "",
      }
    );

    return { success: true };
  } catch (err) {
    throw new Error(err.message);
  }
};



