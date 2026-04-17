import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchChats } from "../../store/chatSlice";
import Sidebar from "./sidebar";
import MessageWindow from "./messageWindow";

const FetchChat = () => {
  const dispatch = useDispatch();
  const [selectedChatId, setSelectedChatId] = useState(null);

  useEffect(() => {
    // 🔥 Fetch all chats when the chat page loads
    dispatch(fetchChats());
  }, [dispatch]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* 📝 SIDEBAR */}
      <Sidebar
        selectedChatId={selectedChatId}
        setSelectedChatId={setSelectedChatId}
      />
      
      {/* 💬 MESSAGE WINDOW */}
      <div style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
        {selectedChatId ? (
          <MessageWindow chatId={selectedChatId} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "gray" }}>
            <h3>Select a chat to start messaging</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default FetchChat;