import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMessages, sendMessageThunk, clearError } from "../../store/messageSlice";
import { startMessageListener, stopMessageListener } from "../../store/messageListener";
import { togglePin, toggleBlock } from "../../store/chatSlice";
import { getAvatarUrl } from "../../api/avatarApi";
import { account } from "../../appwriteConfig";
import UserModal from "../../components/UserModal";

const MessageWindow = ({ chatId, onBack }) => {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.messages.messagesByChat[chatId]) || [];
  const chats = useSelector((state) => state.chats.chats);
  const users = useSelector((state) => state.users.users);
  const messageError = useSelector((state) => state.messages.error);
  const onlineUsers = useSelector((state) => state.presence?.onlineUsers || {});

  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    account.get().then((user) => setCurrentUserId(user.$id));
  }, []);

  useEffect(() => {
    if (!chatId) return;
    dispatch(fetchMessages({ chatId }));
    startMessageListener(chatId, dispatch);
    return () => stopMessageListener();
  }, [chatId, dispatch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (messageError) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messageError, dispatch]);

  const chat = chats.find((c) => c.$id === chatId);
  if (!chat || !currentUserId) return null;

  const otherUserId = chat.members.find((id) => id !== currentUserId);
  const user = users[otherUserId] || {};
  const isOnline = onlineUsers[otherUserId] === "online";
  const isPinned = chat.pinnedBy?.includes(currentUserId);
  const isBlockedByMe = chat?.blockedUsers?.includes(currentUserId);
  const isBlockedByOther = chat?.blockedUsers?.some(id => id !== currentUserId);
  const isBlocked = isBlockedByMe;

  const handleSend = () => {
    if (!text && !file) return;
    dispatch(sendMessageThunk({ chatId, text, file }));
    setText("");
    setFile(null);
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "var(--bg-chat)" }}>
      <header className="h-20 flex-shrink-0 flex items-center justify-between px-4 lg:px-10 z-20" style={{ background: "rgba(10,10,12,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-1 lg:gap-4">
          {onBack && (
            <button 
              onClick={onBack} 
              className="lg:hidden p-2 -ml-2 text-2xl hover:bg-white/5 rounded-full transition-colors"
            >
              ⬅️
            </button>
          )}
          <div 
            className="flex items-center gap-3 lg:gap-4 cursor-pointer p-2 rounded-xl transition-all"
            style={{ borderRadius: "12px" }}
            onClick={() => setIsUserModalOpen(true)}
            onMouseEnter={e => e.currentTarget.style.background = "var(--primary-soft)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div className="relative">
              <img
                src={getAvatarUrl(user.avatarFileID, user.username)}
                alt=""
                className="w-11 h-11 rounded-2xl object-cover shadow-sm"
                style={{ border: "2px solid var(--border-light)" }}
              />
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-black rounded-full transition-colors duration-500 ${
                onlineUsers[otherUserId] === "online" ? "bg-green-500" : "bg-zinc-700"
              }`}></div>
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight" style={{ color: "var(--text-main)" }}>{user.username || "User"}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest transition-colors duration-500" 
                style={{ color: onlineUsers[otherUserId] === "online" ? "#22c55e" : "var(--text-muted)" }}
              >
                {onlineUsers[otherUserId] === "online" ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => dispatch(togglePin(chatId))}
            className="p-2.5 rounded-lg transition-all"
            style={isPinned ? { color: "var(--primary)", background: "var(--primary-light)" } : { color: "var(--text-muted)" }}
            onMouseEnter={e => { if (!isPinned) e.currentTarget.style.background = "var(--primary-soft)"; }}
            onMouseLeave={e => { if (!isPinned) e.currentTarget.style.background = "transparent"; }}
          >
            <span className="text-2xl">📌</span>
          </button>
          <button 
            onClick={() => dispatch(toggleBlock(chatId))}
            className="p-2.5 rounded-lg transition-all"
            style={isBlocked ? { color: "#ef4444", background: "rgba(239, 68, 68, 0.1)" } : { color: "var(--text-muted)" }}
            onMouseEnter={e => { if (!isBlocked) e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; }}
            onMouseLeave={e => { if (!isBlocked) e.currentTarget.style.background = "transparent"; }}
          >
            <span className="text-2xl">🚫</span>
          </button>
        </div>
      </header>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 space-y-4 scroll-smooth scroll-area"
      >
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId || msg.senderId === "me";
          return (
            <div key={msg.$id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-slide-up`}>
              <div className={`group relative max-w-[75%] lg:max-w-[60%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
                <div 
                  className="px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm"
                  style={isMe ? {
                    background: "linear-gradient(135deg, var(--primary), var(--accent))",
                    color: "white",
                    borderBottomRightRadius: "4px"
                  } : {
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                    border: "1px solid var(--border-light)",
                    borderBottomLeftRadius: "4px"
                  }}
                >
                  {msg.deleted ? (
                    <span className="italic opacity-50">Deleted</span>
                  ) : (
                    <>
                      {msg.text && <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>}
                      {msg.fileUrl && (
                        <div className="mt-2 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
                          {msg.type === "image" ? (
                            <img src={msg.fileUrl} alt="" className="max-w-full h-auto" />
                          ) : (
                            <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3" style={{ background: "rgba(168,85,247,0.1)" }}>
                              <span className="text-xl">📄</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest underline">Download</span>
                            </a>
                          )}
                        </div>
                      )}
                      {msg.status === "failed" && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/20">
                          <span className="text-[10px] font-bold text-red-100 opacity-80 flex items-center gap-1">
                            ⚠️ Failed
                          </span>
                          <button 
                            onClick={() => dispatch(sendMessageThunk({ chatId, text: msg.text, file: msg.file }))}
                            className="text-[10px] font-black uppercase tracking-widest bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                          >
                            🔄 Resend
                          </button>
                        </div>
                      )}
                      {msg.status === "sending" && (
                        <div className="mt-2 text-[10px] italic opacity-50 flex items-center gap-2">
                          <div className="animate-spin h-2 w-2 border-t-transparent border-white border rounded-full"></div>
                          Sending...
                        </div>
                      )}
                    </>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: "var(--text-muted)" }}>
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}></div>
      </div>

      <footer className="p-4 flex-shrink-0 relative" style={{ background: "rgba(10,10,12,0.85)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--border-light)" }}>
        {isBlockedByMe ? (
          <div className="flex items-center justify-center py-6 bg-red-900/10 rounded-2xl border border-red-900/20 animate-slide-up">
            <p className="text-xs font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="text-2xl">🚫</span> You have blocked this user
            </p>
          </div>
        ) : (
          <>
            {messageError && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-900/20 text-red-500 px-4 py-2 rounded-xl text-xs font-bold shadow-lg animate-slide-up">
                ⚠️ {messageError}
              </div>
            )}
            {file && (
              <div className="mb-3 p-3 rounded-xl flex items-center justify-between animate-slide-up" style={{ background: "var(--primary-soft)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">📎</span>
                  <span className="text-xs font-bold truncate max-w-[200px]" style={{ color: "var(--primary)" }}>{file.name}</span>
                </div>
                <button onClick={() => setFile(null)} className="font-bold" style={{ color: "var(--text-muted)" }}>✕</button>
              </div>
            )}
            
            <div className="flex items-end gap-3 rounded-2xl p-2 transition-all" style={{ background: "var(--primary-soft)", border: "1px solid var(--border-light)" }}>
              <label className="p-2.5 cursor-pointer transition-colors rounded-xl text-xl flex-shrink-0" style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--border-light)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                📎
              </label>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder-zinc-500 py-2 resize-none"
                style={{ color: "var(--text-main)", maxHeight: "120px", overflowY: "auto" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
              />

              <button 
                onClick={handleSend} 
                disabled={!text && !file}
                className="p-3 rounded-xl transition-all active:scale-95 flex items-center justify-center flex-shrink-0"
                style={{ background: (!text && !file) ? "var(--border-light)" : "linear-gradient(135deg, var(--primary), var(--accent))", color: "white" }}
              >
                ➡️
              </button>
            </div>
            <p className="text-[9px] text-center mt-1 font-medium" style={{ color: "var(--text-muted)" }}>Shift+Enter for new line · Enter to send</p>
          </>
        )}
      </footer>

      {isUserModalOpen && (
        <UserModal 
          user={user} 
          onClose={() => setIsUserModalOpen(false)} 
          hideAction={true} 
        />
      )}
    </div>
  );
};

export default MessageWindow;
