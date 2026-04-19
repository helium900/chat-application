import { account, ID } from "../appwriteConfig";
import { createUser } from "./userApi";
import { startPresence, stopPresence } from "../presence/presence";


export const signup = async ({ email, password }) => {
  try {
    // Ensure we start from a clean state
    try { await account.deleteSession("current"); } catch { }

    const user = await account.create(
      ID.unique(),
      email,
      password
    );

    // ✅ Log in immediately to get the "users" role
    await account.createEmailPasswordSession(email, password);

    // ✅ Now create the user document as an authenticated user
    await createUser({
      ...user,
      username: null
    });

    return { data: user };

  } catch (err) {
    throw new Error(err.message);
  }
};



export const login = async ({ email, password }) => {
  try {
    // Ensure login always starts from a clean auth state.
    // Appwrite throws if createEmailPasswordSession is called while a session exists.
    try { await account.deleteSession("current"); } catch { /* no active session */ }

    const session = await account.createEmailPasswordSession(
      email,
      password
    );

    const user = await account.get();
    return { data: session };

  } catch (err) {
    throw new Error(err.message);
  }
};



export const logout = async () => {
  try {
    await account.deleteSession("current");

    return { success: true };

  } catch (err) {
    throw new Error(err.message);
  }
};



export const getCurrentUser = async () => {
  try {
    const user = await account.get();


    return { data: user };

  } catch (err) {
    // user not logged in
    stopPresence(); // safety
    throw new Error(err.message);
  }
};