import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  togglePin,
  toggleBlock,
  deleteForMe,
} from "../../store/chatSlice";
import { getAvatarUrl } from "../../api/avatarApi";
import { account } from "../../appwriteConfig";

const Sidebar = ({ selectedChatId, setSelectedChatId }) => {
  const dispatch = useDispatch();

  const { chats, loading, error } = useSelector(
    (state) => state.chats
  );

  const onlineUsers = useSelector((state) => state.presence.onlineUsers);
  const users = useSelector((state) => state.users.users);

  const [currentUserId, setCurrentUserId] = useState(null);

  // 🔥 long press state
  const [activeChat, setActiveChat] = useState(null);
  const timerRef = useRef(null);

  // 🔥 get current user
  useEffect(() => {
    const getUser = async () => {
      const user = await account.get();
      setCurrentUserId(user.$id);
    };
    getUser();
  }, []);

  // =========================
  // 🔥 LONG PRESS HANDLERS
  // =========================
  const handleMouseDown = (chatId) => {
    timerRef.current = setTimeout(() => {
      setActiveChat(chatId);
    }, 500);
  };

  const handleMouseUp = () => {
    clearTimeout(timerRef.current);
  };

  const handleClick = (chatId) => {
    if (!activeChat) {
      setSelectedChatId(chatId);
    }
  };

  return (
    <div style={{ width: "30%", borderRight: "1px solid #ddd" }}>
      <h3 style={{ padding: 10 }}>Chats</h3>

      {loading && <p style={{ padding: 10 }}>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ✅ FIXED: Added sorting logic here so pinned chats float to the top dynamically */}
      {[...chats]
        .sort((a, b) => {
          if (!currentUserId) return 0;
          const aPinned = a.pinnedBy?.includes(currentUserId);
          const bPinned = b.pinnedBy?.includes(currentUserId);
          if (aPinned && !bPinned) return -1;
          if (!aPinned && bPinned) return 1;
          return 0; // Maintain API order if both are pinned/unpinned
        })
        .map((chat) => {
        if (!currentUserId) return null;

        const otherUserId = chat.members.find(
          (id) => id !== currentUserId
        );

        const user = users[otherUserId] || {};
        const status = onlineUsers[otherUserId] || "offline";

        const isPinned = chat.pinnedBy?.includes(currentUserId);
        const isBlocked = chat.blockedUsers?.includes(currentUserId);

        return (
          <div
            key={chat.$id}
            onMouseDown={() => handleMouseDown(chat.$id)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => handleClick(chat.$id)}
            style={{
              padding: 10,
              cursor: "pointer",
              background:
                selectedChatId === chat.$id ? "#eee" : "transparent",
              position: "relative",
            }}
          >
            <img
              src={getAvatarUrl(user.avatarFileID, user.username)}
              alt=""
              style={{ width: 40, borderRadius: "50%" }}
            />

            <div>
              {user.username || "Unknown"}
              {isPinned && " 📌"}
              {isBlocked && " 🚫"}
            </div>

            <div>
              {status === "online"
                ? "🟢"
                : status === "active"
                  ? "🟡"
                  : "⚫"}
            </div>

            {/* 🔥 LONG PRESS MENU */}
            {activeChat === chat.$id && (
              <div
                style={{
                  position: "absolute",
                  right: 10,
                  top: 10,
                  background: "#fff",
                  border: "1px solid #ccc",
                  padding: 5,
                  borderRadius: 5,
                  display: "flex",
                  gap: 10,
                }}
              >
                {/* ✅ PIN / UNPIN */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(togglePin(chat.$id));
                    setActiveChat(null);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {isPinned ? "❌📌" : "📌"}
                </span>

                {/* ✅ BLOCK / UNBLOCK */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(toggleBlock(chat.$id));
                    setActiveChat(null);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {isBlocked ? "❌🚫" : "🚫"}
                </span>

                {/* 🗑 DELETE (ME) */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(deleteForMe(chat.$id));
                    setActiveChat(null);
                  }}
                  style={{ cursor: "pointer", color: "red" }}
                >
                  Delete
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Sidebar;