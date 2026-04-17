import {Client, Databases, Account, Storage,ID  } from  "appwrite";

const client = new Client();

client
.setEndpoint("https://fra.cloud.appwrite.io/v1")
.setProject("69d0f2190024b30fe278");

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export {client, ID};