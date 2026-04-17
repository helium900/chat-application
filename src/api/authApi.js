import { account, ID } from "../appwriteConfig";
import { createUser, getUserById } from "./userApi";
import { startPresence, stopPresence } from "./presenceApi";


export const signup = async ({ email, password }) => {
  try {
    const user = await account.create(
      ID.unique(),
      email,
      password
    );

    await createUser({
      ...user,
      username: null
    });
    const session = await account.createEmailPasswordSession(email, password);
    startPresence(user.$id);
    return { data: user };

  } catch (err) {
    throw new Error(err.message);
  }
};



export const login = async ({ email, password }) => {
  try {
    const session = await account.createEmailPasswordSession(
      email,
      password
    );

    const user = await account.get();
    const dbUser = await getUserById(user.$id);

 
    startPresence(user.$id);

    return {
      data: session,
      needsUsername: !dbUser.data.username
    };

  } catch (err) {
    throw new Error(err.message);
  }
};



export const logout = async () => {
  try {
    const user = await account.get();

  
    stopPresence();

    await account.deleteSession("current");

    return { success: true };

  } catch (err) {
    throw new Error(err.message);
  }
};



export const getCurrentUser = async () => {
  try {
    const user = await account.get();

 
    startPresence(user.$id);

    return { data: user };

  } catch (err) {
    // user not logged in
    stopPresence(); // safety
    throw new Error(err.message);
  }
};