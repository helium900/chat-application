import { databases } from "../appwriteConfig";
import { Query } from "appwrite";

const DB_ID = "69d0f31d001e2eeda01b";
const USER_COLLECTION = "users";


export const createUser = async (user) => {
    try {
        return await databases.createDocument(
            DB_ID,
            USER_COLLECTION,
            user.$id, //  auth ID = document ID
            {
                username: null,
                email: user.email,
                userID: user.$id,
                lastSeen: Date.now(),
                avatarFileID: null,
            }
        );
    } catch (err) {
        throw new Error(err.message);
    }
};



export const setUsername = async (userId, username) => {
    const normalized = username.trim().toLowerCase();
    if (!normalized) {
        throw new Error("Username cannot be empty");
      }

    try {
        const res = await databases.updateDocument(
            DB_ID,
            USER_COLLECTION,
            userId,
            {
                username: normalized
            }
        );

        return res;

    } catch (err) {
        if (err.code === 409) {
            throw new Error("Username already taken");
          }
        throw new Error(err.message);
    }
};



export const searchUser = async (username) => {
    try {
        const normalized = username.trim().toLowerCase();
        if (!normalized) return []

        const res = await databases.listDocuments(
            DB_ID,
            USER_COLLECTION,
            [Query.search("username", normalized), Query.limit(10)]
        )

        return res.documents;

    } catch (err) {
        throw new Error(err.message);
    }
};



export const getUserByUsername = async (username) => {
    try {
        const normalized = username.trim().toLowerCase();
        if (!normalized) {
            throw new Error("Username cannot be empty");
          }

        const res = await databases.listDocuments(
            DB_ID,
            USER_COLLECTION,
            [Query.equal("username", normalized)]
        );

        if (!res.documents.length) {
            throw new Error("User not found");
        }

        return res.documents[0];

    } catch (err) {
        throw new Error(err.message);
    }
};


export const getUserById = async (userID) => {
    try {
        return await databases.getDocument(
            DB_ID,
            USER_COLLECTION,
            userID
        );
    } catch (err) {
        throw new Error(err.message);
    }
};

