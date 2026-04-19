import {Client, Databases, Account, Storage, ID, Avatars} from  "appwrite";

const client = new Client();

client
.setEndpoint("https://cloud.appwrite.io/v1")
.setProject("69d0f2190024b30fe278");

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);

export {client, ID};