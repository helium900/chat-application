import { databases } from "../appwriteConfig";
import { Query, Permission, Role } from "appwrite";

const DB_ID = "69d0f31d001e2eeda01b";
const USER_COLLECTION = "users";

export const createUser = async (user) => {
    return await databases.createDocument(
        DB_ID,
        USER_COLLECTION,
        user.$id,
        {
            username: "",
        },
        [
            Permission.read(Role.any()),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
        ]
    );
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
        if (!normalized) return [];

        // FALLBACK SEARCH: Try startsWith first, as it's more common than search (which requires fulltext)
        try {
            const res = await databases.listDocuments(
                DB_ID,
                USER_COLLECTION,
                [Query.limit(10), Query.startsWith("username", normalized)]
            );
            return res.documents;
        } catch (searchErr) {
            console.warn("Search with startsWith failed, trying exact match fallback", searchErr.message);
            // Last resort: exact match or just return empty
            const res = await databases.listDocuments(
                DB_ID,
                USER_COLLECTION,
                [Query.limit(10), Query.equal("username", normalized)]
            );
            return res.documents;
        }

    } catch (err) {
        console.error("User search failed completely", err.message);
        return []; // Return empty instead of throwing to prevent UI crash
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
