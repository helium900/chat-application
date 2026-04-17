import { storage, ID } from "../appwriteConfig";
import { Permission, Role } from "appwrite";

const BUCKET_ID = "69d0f5af000dab430051";


const FILE_RULES = {
  video: {
    types: ["video/mp4", "video/webm"],
    maxSize: 100 * 1024 * 1024,
  },
  image: {
    types: ["image/jpeg", "image/jpg", "image/png"],
    maxSize: 5 * 1024 * 1024,
  },
  pdf: {
    types: ["application/pdf"],
    maxSize: 50 * 1024 * 1024,
  },
};


const validateFile = (file) => {
  for (let category in FILE_RULES) {
    const rule = FILE_RULES[category];

    if (rule.types.includes(file.type)) {
      if (file.size > rule.maxSize) {
        throw new Error(
          `${category.toUpperCase()} too large. Max size is ${
            rule.maxSize / (1024 * 1024)
          } MB`
        );
      }
      return category;
    }
  }

  throw new Error("Unsupported file type");
};


export const uploadMedia = async ({ file, senderId, receiverId }) => {
  try {
    const fileCategory = validateFile(file);

    const res = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      file,
      [
        Permission.read(Role.user(senderId)),
        Permission.read(Role.user(receiverId)),
        Permission.delete(Role.user(senderId)),
      ] 
    );

    return {
      data: {
        fileId: res.$id,
        url: storage.getFileView(BUCKET_ID, res.$id),
        type: fileCategory,
        mimeType: file.type,
      },
    };
  } catch (err) {
    throw new Error(err.message);
  }
};


export const deleteMedia = async (fileId) => {
  try {
    await storage.deleteFile(BUCKET_ID, fileId);
    return { data: "file deleted successfully" };
  } catch (err) {
    throw new Error(err.message);
  }
};