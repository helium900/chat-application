import { databases, client } from "../appwriteConfig";

const DB_ID = "69d0f31d001e2eeda01b";
const USER_COLLECTION = "users";

let heartbeatInterval = null;
let lastUpdate = 0;
let presenceErrorCount = 0;
const MAX_PRESENCE_ERRORS = 5; // Allow more errors before warning


const updateLastSeen = async (userID) => {
// No hard block on errors, just throttle and log

    const now = new Date();
    const nowMs = now.getTime();
    
    if (nowMs - lastUpdate < 4000) return;
    lastUpdate = nowMs;

    try {
        await databases.updateDocument(
            DB_ID,
            USER_COLLECTION,
            userID,
            {
                lastSeen: now.getTime() // Using ms timestamp (Integer)
            }
        );
        presenceErrorCount = 0; // Reset on success
    } catch (err) {
        presenceErrorCount++;
        if (presenceErrorCount % MAX_PRESENCE_ERRORS === 0) {
            console.error(`Presence heartbeat failing (${presenceErrorCount} errors):`, err.message);
        }
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
    if (!lastSeen) return "offline";
    
    // Handle both timestamp numbers and ISO strings
    const lastSeenTime = typeof lastSeen === 'number' ? lastSeen : Date.parse(lastSeen);
    if (isNaN(lastSeenTime)) return "offline";

    const diff = Date.now() - lastSeenTime;

    if (diff < 35000) return "online"; 
    return "offline";
};