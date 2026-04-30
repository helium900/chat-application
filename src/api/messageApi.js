import { databases, client, ID, account } from "../appwriteConfig";
import { Query, Permission, Role } from "appwrite";
import { uploadMedia, deleteMedia } from "./storageApi";

const DB_ID = "69d0f31d001e2eeda01b";
const MESSAGE_COLLECTION = "message";
const CHAT_COLLECTION = "chats";

export const sendMessage = async ({
  chatId,
  text = "",
  file = null,
}) => {
  try {
    if (!text && !file) {
      throw new Error("Message cannot be empty");
    }

    const user = await account.get();
    const senderId = user.$id;

    const chat = await databases.getDocument(
      DB_ID,
      CHAT_COLLECTION,
      chatId
    );

    const members = chat.members || [];
    const blockedBy = chat.blockedUsers || [];

    const isSenderBlocked = members.some(memberId => 
      memberId !== senderId && blockedBy.includes(memberId)
    );

    if (isSenderBlocked) {
      throw new Error("You cannot send messages to this user");
    }

    if (blockedBy.includes(senderId)) {
      throw new Error("You have blocked this user. Unblock to send messages.");
    }

    let fileUrl = "";
    let fileId = "";
    let type = "text";

    if (file) {
      const fileRes = await uploadMedia({
        file,
        members,
      });

      fileUrl = fileRes.data.url;
      fileId = fileRes.data.fileId;
      type = fileRes.data.type;
    }

    const createdAt = new Date().toISOString();

    const permissions = members
      .filter(id => id === senderId || !blockedBy.includes(id))
      .map(id => Permission.read(Role.user(id)));
      
    permissions.push(Permission.update(Role.user(senderId)));
    permissions.push(Permission.delete(Role.user(senderId)));

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

    if (!isSenderBlocked) {
      try {
        await databases.updateDocument(DB_ID, CHAT_COLLECTION, chatId, {
          updatedAt: createdAt,
          lastMessage: text || type,
          hiddenFor: [],
        });
      } catch (updateErr) {
        console.warn("Could not update chat metadata, probably missing update permissions:", updateErr.message);
      }
    }

    return { data: message };
  } catch (err) {
    throw new Error(err.message);
  }
};

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

export const subscribeToMessages = (chatId, callback) => {
  const unsubscribe = client.subscribe(
    `databases.${DB_ID}.collections.${MESSAGE_COLLECTION}.documents`,
    (response) => {
      const message = response.payload;

      const isCreate = response.events.some(event => event.includes(".create"));
      const isUpdate = response.events.some(event => event.includes(".update"));

      if (
        (isCreate || isUpdate) &&
        message.chatId === chatId
      ) {
        callback(message);
      }
    }
  );

  return unsubscribe;
};

export const subscribeToAllMessages = (callback) => {
  const unsubscribe = client.subscribe(
    `databases.${DB_ID}.collections.${MESSAGE_COLLECTION}.documents`,
    (response) => {
      const message = response.payload;

      const isCreate = response.events.some(event => event.includes(".create"));
      const isUpdate = response.events.some(event => event.includes(".update"));

      if (isCreate || isUpdate) {
        callback(message);
      }
    }
  );

  return unsubscribe;
};

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
