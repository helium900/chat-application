import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMessages,
  sendMessageThunk,
} from "../../store/messageSlice";
import {
  startMessageListener,
  stopMessageListener,
} from "../../store/messageListener";
import { togglePin, toggleBlock } from "../../store/chatSlice";
import { getAvatarUrl } from "../../api/avatarApi";
import { account } from "../../appwriteConfig";

const MessageWindow = ({ chatId }) => {
  const dispatch = useDispatch();

  const messages =
    useSelector((state) => state.messages.messagesByChat[chatId]) || [];

  const chats = useSelector((state) => state.chats.chats);
  const users = useSelector((state) => state.users.users);

  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  // ========================================
  // 🔥 GET CURRENT USER
  // ========================================
  useEffect(() => {
    account.get().then((user) => {
      setCurrentUserId(user.$id);
    });
  }, []);

  // ========================================
  // 🔥 INITIAL LOAD + REALTIME
  // ========================================
  useEffect(() => {
    if (!chatId) return;

    dispatch(fetchMessages({ chatId }));

    startMessageListener(chatId, dispatch);

    return () => {
      stopMessageListener();
    };
  }, [chatId, dispatch]);

  // ========================================
  // 🔥 AUTO SCROLL (ONLY NEW MESSAGES)
  // ========================================
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const chat = chats.find((c) => c.$id === chatId);
  if (!chat || !currentUserId) return null;

  const otherUserId = chat.members.find(
    (id) => id !== currentUserId
  );

  const user = users[otherUserId] || {};

  const isPinned = chat.pinnedBy?.includes(currentUserId);
  const isBlocked = chat.blockedUsers?.includes(currentUserId);

  // ========================================
  // 🔥 PAGINATION (SCROLL UP)
  // ========================================
  const handleScroll = async () => {
    const container = containerRef.current;

    if (!container || loadingMore) return;

    if (container.scrollTop === 0) {
      setLoadingMore(true);

      const oldestMessageId = messages[0]?.$id;

      if (oldestMessageId) {
        await dispatch(
          fetchMessages({
            chatId,
            lastMessageId: oldestMessageId,
          })
        );
      }

      setLoadingMore(false);
    }
  };

  // ========================================
  // 🔥 SEND MESSAGE
  // ========================================
  const handleSend = () => {
    if (!text && !file) return;

    dispatch(sendMessageThunk({ chatId, text, file }));

    setText("");
    setFile(null);
  };

  // ========================================
  // 🔥 FILE
  // ========================================
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
  };

  // ========================================
  // 🔥 TIME FORMAT
  // ========================================
  const formatTime = (time) => {
    const date = new Date(time);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ========================================
  // 🔥 DATE LABEL
  // ========================================
  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString())
      return "Today";

    if (date.toDateString() === yesterday.toDateString())
      return "Yesterday";

    return date.toLocaleDateString();
  };

  // ========================================
  // 🔥 RENDER
  // ========================================

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* 🔝 TOP BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: 10 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src={getAvatarUrl(user.avatarFileID, user.username)}
            style={{ width: 40, borderRadius: "50%", marginRight: 10 }}
          />
          <div>{user.username || "Unknown"}</div>
        </div>

        <div>
          <button onClick={() => dispatch(togglePin(chatId))}>
            {isPinned ? "📌" : "📍"}
          </button>

          <button onClick={() => dispatch(toggleBlock(chatId))}>
            {isBlocked ? "✅" : "🚫"}
          </button>
        </div>
      </div>

      {/* 💬 MESSAGES */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: "auto", padding: 10 }}
      >
        {loadingMore && <p>Loading...</p>}

        {messages.map((msg, index) => {
          const currentDate = formatDateLabel(msg.createdAt);
          const prevMsg = messages[index - 1];
          const prevDate = prevMsg ? formatDateLabel(prevMsg.createdAt) : null;
          const showDate = currentDate !== prevDate;

          return (
            <div key={msg.$id}>

              {/* 📅 DATE */}
              {showDate && (
                <div style={{ textAlign: "center", margin: 10, color: "gray" }}>
                  {currentDate}
                </div>
              )}

              <div
                style={{
                  textAlign:
                    msg.senderId === currentUserId ? "right" : "left",
                  marginBottom: 10,
                }}
              >
                {msg.deleted ? (
                  <div style={{ color: "gray" }}>{msg.text}</div>
                ) : (
                  <>
                    {msg.text && <div>{msg.text}</div>}

                    {msg.fileUrl && msg.type === "image" && (
                      <img src={msg.fileUrl} style={{ maxWidth: 200 }} />
                    )}

                    {msg.fileUrl && msg.type !== "image" && (
                      <a href={msg.fileUrl}>📎 File</a>
                    )}
                  </>
                )}

                <div style={{ fontSize: 10, color: "gray" }}>
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef}></div>
      </div>

      {/* ✉️ INPUT */}
      <div style={{ display: "flex", padding: 10 }}>
        <input type="file" onChange={handleFileChange} />

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isBlocked}
          style={{ flex: 1 }}
        />

        <button onClick={handleSend} disabled={isBlocked}>
          Send
        </button>
      </div>
    </div>
  );
};

export default MessageWindow;