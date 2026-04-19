import { databases, storage, avatars } from "../appwriteConfig";
import { deleteMedia, uploadMedia } from "./storageApi";

const DB_ID = "69d0f31d001e2eeda01b";
const USER_COLLECTION = "users";
const BUCKET_ID = "69d0f5af000dab430051";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];


export const getDefaultAvatar = (username) => {
  try {
    return avatars.getInitials(username).toString();
  } catch {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || "U")}`;
  }
};


export const getAvatarUrl = (fileId, username) => {
  if (!fileId) return getDefaultAvatar(username);
  try {
    // Add a timestamp to bypass browser caching when avatars update
    return `${storage.getFileView(BUCKET_ID, fileId)}&t=${Date.now()}`;
  } catch {
    return getDefaultAvatar(username);
  }
};


export const uploadAvatar = async (file, userId, oldFileId) => {
  try {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error("Only image files are allowed");
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error("Image must be less than 10 MB");
    }

    // delete old
    if (oldFileId) {
      try {
        await deleteMedia(oldFileId);
      } catch (err) {
        console.warn("Failed to delete old avatar", err.message);
      }
    }

   
    const res = await uploadMedia({
      file,
      members: [userId], 
      isAvatar: true,
    });

    await databases.updateDocument(DB_ID, USER_COLLECTION, userId, {
      avatarFileID: res.data.fileId,
    });

    return { data: res.data.fileId };
  } catch (err) {
    return { error: err.message };
  }
};


export const deleteAvatar = async (userId, fileId) => {
  try {
    if (fileId) {
      await deleteMedia(fileId);
    }

    await databases.updateDocument(DB_ID, USER_COLLECTION, userId, {
      avatarFileID: null,
    });

    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
};
