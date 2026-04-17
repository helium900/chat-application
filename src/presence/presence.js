import { databases, client } from "../appwriteConfig";

const DB_ID = "69d0f31d001e2eeda01b";
const USER_COLLECTION = "users";

let heartbeatInterval = null;
let lastUpdate = 0;


const updateLastSeen = async (userID) => {
    const now = Date.now();


    if (now - lastUpdate < 4000) return;

    lastUpdate = now;

    try {
        await databases.updateDocument(
            DB_ID,
            USER_COLLECTION,
            userID,
            {
                lastSeen: now
            }
        );
    } catch (err) {
        console.error("Presence update failed:", err.message);
    }
};


export const startPresence = (userID) => {
    if (heartbeatInterval) return;
    
    updateLastSeen(userID);


    heartbeatInterval = setInterval(() => {
        updateLastSeen(userID);
    }, 5000);
};


export const stopPresence = () => {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
};


export const subscribeToPresence = (callback) => {
    const unsubscribe = client.subscribe(
        `databases.${DB_ID}.collections.${USER_COLLECTION}.documents`,
        (response) => {
            if (
                response.events.includes(
                    "databases.*.collections.*.documents.*.update"
                )
            ) {
                callback(response.payload);
            }
        }
    );

    return unsubscribe;
};


export const getUserStatus = (lastSeen) => {
    const diff = Date.now() - lastSeen;

    if (diff < 5000) return "online";
    if (diff < 30000) return "active";
    return "offline";
};
//The frontend calls subscribeToPresence
//  to listen for real-time updates. When data changes,
//  it receives the updated user, and then getUserStatus
//  is used to decide what status (online, active, offline) to show.” and start presence stop presence handle the status in backend 