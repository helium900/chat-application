import { client } from "../appwriteConfig";
import { updateUser } from "./userSlice";

const DB_ID = "69d0f31d001e2eeda01b";
const USER_COLLECTION = "users";

let unsubscribe;

export const startUserListener = (dispatch) => {
    if (unsubscribe) unsubscribe();

    unsubscribe = client.subscribe(
        [`databases.${DB_ID}.collections.${USER_COLLECTION}.documents`],
        (response) => {
          
            if (response.events.some(e => e.includes(".documents.") && (e.includes(".update") || e.includes(".create")))) {
                console.log("?? Profile Syncing:", response.payload.username || response.payload.$id);
                dispatch(updateUser(response.payload));
            }
        }
    );
};

export const stopUserListener = () => {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
};
