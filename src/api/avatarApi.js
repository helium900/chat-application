import { databases, storage } from "../appwriteConfig";
import { deleteMedia, uploadMedia } from "./storageApi";

const DB_ID = "69d0f31d001e2eeda01b";
const USER_COLLECTION = "users";
const BUCKET_ID = "69d0f5af000dab430051";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

// ✅ Default Avatar
export const getDefaultAvatar = (username) => {
  return `https://cloud.appwrite.io/v1/avatars/initials?name=${encodeURIComponent(
    username
  )}`;
};

// ✅ Get Avatar URL
export const getAvatarUrl = (fileId, username) => {
  if (!fileId) return getDefaultAvatar(username);
  return storage.getFileView(BUCKET_ID, fileId);
};

// ✅ Upload Avatar
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
      await deleteMedia(oldFileId);
    }

    // upload new (self access only or public)
    const res = await uploadMedia({
      file,
      senderId: userId,
      members: [userId], // or make public inside uploadMedia
    });

    await databases.updateDocument(DB_ID, USER_COLLECTION, userId, {
      avatarFileID: res.data.fileId,
    });

    return { data: res.data.fileId };
  } catch (err) {
    return { error: err.message };
  }
};

// ✅ Delete Avatar
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