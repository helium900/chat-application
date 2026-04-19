import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchChats, startNewChat, setActiveChat } from "../../store/chatSlice";
import { startPresenceListener, stopPresenceListener } from "../../store/presenceSlice";
import { startChatListener, stopChatListener } from "../../store/chatListener";
import { setCurrentUserIdForListener, startGlobalMessageListener, stopGlobalMessageListener } from "../../store/messageListener";
import { account } from "../../appwriteConfig";
import { startPresence, stopPresence } from "../../presence/presence";
import Sidebar from "./sidebar";
import MessageWindow from "./messageWindow";
import GlobalSearch from "../../components/GlobalSearch";
import { startUserListener, stopUserListener } from "../../store/userListener";

const FetchChat = () => {
  const dispatch = useDispatch();
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchChats());

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    account.get().then((user) => {
      setCurrentUserIdForListener(user.$id);
      startChatListener(user.$id, dispatch);
      startGlobalMessageListener(dispatch);
      dispatch(startPresenceListener());
      startUserListener(dispatch);
      startPresence(user.$id);
    }).catch(err => console.error("Could not start chat listener:", err));

    return () => {
      stopChatListener();
      stopGlobalMessageListener();
      dispatch(stopPresenceListener());
      stopUserListener();
      stopPresence();
    };
  }, [dispatch]);

  const handleSelectChat = (id) => {
    setSelectedChatId(id);
    dispatch(setActiveChat(id));
    setIsSidebarOpen(false);
  };

  const handleChatStart = async (user) => {
    try {
      const resultAction = await dispatch(startNewChat(user.$id));
      if (startNewChat.fulfilled.match(resultAction)) {
        handleSelectChat(resultAction.payload.$id);
      }
    } catch (error) {
      console.error("Failed to start chat", error);
    }
  };

  return (
    <div className="dashboard-container" style={{ background: "var(--bg-app)" }}>
      <aside className={`sidebar-fixed ${isSidebarOpen ? 'open' : ''}`} style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border-light)" }}>
        <Sidebar
          selectedChatId={selectedChatId}
          setSelectedChatId={handleSelectChat}
        />
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-6 right-[-45px] w-8 h-8 rounded-full shadow-lg flex items-center justify-center text-sm font-bold transition-all"
          style={{ background: "var(--bg-card)", color: "var(--text-main)", border: "1px solid var(--border-light)" }}
        >
          ✕
        </button>
      </aside>
      
      <main className="main-fixed" style={{ background: "var(--bg-app)" }}>
        <header className="h-20 flex-shrink-0 flex items-center justify-between px-6 lg:px-10 border-b z-50" style={{ background: "rgba(5,5,5,0.8)", backdropFilter: "blur(12px)", borderColor: "var(--border-light)" }}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: "var(--primary)" }}
            >
              ☰
            </button>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-main)" }}>Messages</h1>
          </div>
          
          <div className="flex-1 max-w-xl mx-4 sm:mx-10">
            <GlobalSearch onChatStart={handleChatStart} />
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden">
          {selectedChatId ? (
            <MessageWindow 
              chatId={selectedChatId} 
              onBack={() => {
                setSelectedChatId(null);
                dispatch(setActiveChat(null));
              }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-slide-up">
              <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-5xl mb-6 shadow-2xl" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", boxShadow: "0 10px 40px -10px rgba(168, 85, 247, 0.4)" }}>
                💬
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-main)" }}>No conversation selected</h2>
              <p className="text-sm max-w-[280px]" style={{ color: "var(--text-muted)" }}>Select a chat from the sidebar or search for users to start messaging.</p>
            </div>
          )}
        </div>

        {isSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </main>
    </div>
  );
};

export default FetchChat;
