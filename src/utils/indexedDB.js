

const DB_NAME = "chatapp_db";
const DB_VERSION = 2;
const STORE_NAME = "messages";
const CHATS_STORE_NAME = "chats";

let db = null;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        // Store messages keyed by chatId
        database.createObjectStore(STORE_NAME, { keyPath: "chatId" });
      }
      if (!database.objectStoreNames.contains(CHATS_STORE_NAME)) {
      
        database.createObjectStore(CHATS_STORE_NAME, { keyPath: "userId" });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };
  });
};


export const getMessagesFromDB = (chatId) => {
  return new Promise((resolve) => {
    if (!db) return resolve([]);

    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(chatId);

    request.onsuccess = () => {
      resolve(request.result?.messages || []);
    };

    request.onerror = () => {
      resolve([]);
    };
  });
};


export const saveMessagesToDB = (chatId, messages) => {
  return new Promise((resolve, reject) => {
    if (!db) return resolve();

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ chatId, messages });

    tx.oncomplete = () => resolve();
    tx.onerror = (event) => reject(event.target.error);
  });
};


export const getChatsFromDB = (userId = "default") => {
  return new Promise((resolve) => {
    if (!db) return resolve([]);

    const tx = db.transaction(CHATS_STORE_NAME, "readonly");
    const store = tx.objectStore(CHATS_STORE_NAME);
    const request = store.get(userId);

    request.onsuccess = () => {
      resolve(request.result?.chats || []);
    };

    request.onerror = () => {
      resolve([]);
    };
  });
};


export const saveChatsToDB = (userId = "default", chats) => {
  return new Promise((resolve, reject) => {
    if (!db) return resolve();

    const tx = db.transaction(CHATS_STORE_NAME, "readwrite");
    const store = tx.objectStore(CHATS_STORE_NAME);
    store.put({ userId, chats });

    tx.oncomplete = () => resolve();
    tx.onerror = (event) => reject(event.target.error);
  });
};
