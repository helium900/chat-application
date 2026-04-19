import { storage, ID } from "../appwriteConfig";
import { Permission, Role } from "appwrite";

const BUCKET_ID = "69d0f5af000dab430051";


const FILE_RULES = {
  video: {
    types: ["video/mp4", "video/webm"],
    maxSize: 100 * 1024 * 1024,
  },
  image: {
    types: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    maxSize: 10 * 1024 * 1024,
  },
  pdf: {
    types: ["application/pdf"],
    maxSize: 50 * 1024 * 1024,
  },
  text: {
    types: ["text/plain", "text/csv", "application/json"],
    maxSize: 10 * 1024 * 1024, // 10 MB limit for text files
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


export const uploadMedia = async ({ file, members = [], isAvatar = false }) => {
  try {
    const fileCategory = validateFile(file);

    let permissions = members.map((id) => Permission.read(Role.user(id)));
    
    // ✅ Avatars MUST be publicly readable for search/profile cards
    if (isAvatar) {
      permissions = [Permission.read(Role.any())];
    }

    // Allow the first member (sender) to delete/update
    if (members[0]) {
      permissions.push(Permission.update(Role.user(members[0])));
      permissions.push(Permission.delete(Role.user(members[0])));
    }

    const res = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      file
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