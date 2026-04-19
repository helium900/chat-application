import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { togglePin, toggleBlock, deleteForMe } from "../../store/chatSlice";
import { getAvatarUrl } from "../../api/avatarApi";
import { account } from "../../appwriteConfig";
import SettingsModal from "../../components/SettingsModal";
import { fetchUser } from "../../store/userSlice";

const Sidebar = ({ selectedChatId, setSelectedChatId }) => {
  const dispatch = useDispatch();
  const { chats, loading, error } = useSelector((state) => state.chats);

  const { users } = useSelector((state) => state.users);
  const onlineUsers = useSelector((state) => state.presence?.onlineUsers || {});

  const [currentUserId, setCurrentUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await account.get();
        setCurrentUserId(user.$id);
        dispatch(fetchUser(user.$id));
      } catch (err) {
        console.error("Failed to get user", err);
      }
    };
    getUser();
  }, []);

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      if (!currentUserId) return false;
      const otherUserId = chat.members.find((id) => id !== currentUserId);
      const user = users[otherUserId] || {};
      return (user.username || "").toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [chats, searchTerm, users, currentUserId]);

  const sortedChats = useMemo(() => {
    return [...filteredChats].sort((a, b) => {
      if (!currentUserId) return 0;
      const aPinned = a.pinnedBy?.includes(currentUserId);
      const bPinned = b.pinnedBy?.includes(currentUserId);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return new Date(b.lastMessageAt || b.$updatedAt || 0) - new Date(a.lastMessageAt || a.$updatedAt || 0);
    });
  }, [filteredChats, currentUserId]);

  const currentUserData = currentUserId ? users[currentUserId] : null;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "transparent" }}>
     
      <div className="p-6 flex flex-col gap-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-main)" }}>Chats</h2>
        </div>


        <div className="relative group">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300">🔍</span>
          <input
            type="text"
            placeholder="Search..."
            className="w-full border-none rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 transition-all"
            style={{ background: "var(--primary-soft)", color: "var(--text-main)", focusRingColor: "var(--primary)" }}

            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

    
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scroll-area">
        {loading && (
          <div className="flex justify-center p-8">
            <div className="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}></div>
          </div>

        )}

        {!loading && currentUserId && sortedChats.length === 0 && (
          <div className="text-center p-8 opacity-40">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>No chats found</p>
          </div>
        )}

        {sortedChats.map((chat) => {
          if (!currentUserId) return null;
          const otherUserId = chat.members.find((id) => id !== currentUserId);
          const user = users[otherUserId] || {};
          const status = onlineUsers[otherUserId] || "offline";
          const isPinned = chat.pinnedBy?.includes(currentUserId);
          const isBlocked = chat.blockedUsers?.includes(currentUserId);
          const isActive = selectedChatId === chat.$id;


          return (
            <div
              key={chat.$id}
              onClick={() => setSelectedChatId(chat.$id)}
              className={`group relative flex items-center p-3 rounded-xl cursor-pointer transition-all`}
              style={isActive ? {
                background: "linear-gradient(135deg, var(--primary), var(--accent))",
                color: "white",
                boxShadow: "0 4px 20px rgba(168, 85, 247, 0.3)"
              } : {
                background: "transparent",
                color: "var(--text-main)"
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--primary-soft)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}

            >
              <div className="relative flex-shrink-0">
                <img
                  src={getAvatarUrl(user.avatarFileID, user.username)}
                  alt=""
                  className={`w-12 h-12 rounded-2xl object-cover shadow-sm ${isActive ? "border-2 border-white/30" : ""}`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getAvatarUrl(null, user.username);
                  }}
                />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 transition-colors duration-500 ${
                  isActive ? "border-purple-600" : "border-[var(--bg-sidebar)]"
                } ${
                  status === "online" ? "bg-green-500" : "bg-zinc-700"
                }`}></div>

              </div>

              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 min-w-0">
                  <span className={`font-bold truncate text-sm ${isActive ? "text-white" : ""}`} style={!isActive ? { color: "var(--text-main)" } : {}}>
                    {user.username || "User"}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isPinned && <span className="text-[16px] leading-none" style={{ marginTop: "-1px" }}>📌</span>}
                    {isBlocked && <span className="text-[16px] leading-none" style={{ marginTop: "-1px" }}>🚫</span>}
                  </div>
                </div>
                <p className={`text-[11px] truncate font-medium ${isActive ? "text-white/70" : ""}`} style={!isActive ? { color: "var(--text-muted)" } : {}}>

                  {isBlocked ? "Blocked" : "Active chat"}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(activeMenu === chat.$id ? null : chat.$id);
                }}
                className={`ml-1 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 ${isActive ? "text-white hover:bg-white/10" : "hover:bg-[var(--primary-soft)]"}`}
                style={!isActive ? { color: "var(--text-muted)" } : {}}
              >
                ⋮
              </button>

              {activeMenu === chat.$id && (
                <div 
                  className="absolute right-4 top-14 rounded-xl shadow-2xl z-50 w-48 py-1 animate-slide-up"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { dispatch(togglePin(chat.$id)); setActiveMenu(null); }}
                    className="w-full px-4 py-2 text-left text-xs font-bold transition-colors flex items-center gap-2"
                    style={{ color: "var(--text-sub)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--primary-soft)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span className="text-lg leading-none">{isPinned ? "📍" : "📌"}</span>
                    <span>{isPinned ? "Unpin Chat" : "Pin Chat"}</span>
                  </button>
                  <button
                    onClick={() => { dispatch(toggleBlock(chat.$id)); setActiveMenu(null); }}
                    className="w-full px-4 py-2 text-left text-xs font-bold transition-colors flex items-center gap-2"
                    style={{ color: "var(--text-sub)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--primary-soft)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span className="text-lg leading-none">{isBlocked ? "🔓" : "🚫"}</span>
                    <span>{isBlocked ? "Unblock User" : "Block User"}</span>
                  </button>
                  <div className="h-[1px] my-1 mx-2" style={{ background: "var(--border-light)" }}></div>
                  <button
                    onClick={() => { dispatch(deleteForMe(chat.$id)); setActiveMenu(null); }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-900/20 transition-colors flex items-center gap-2"
                  >
                    <span className="text-lg leading-none">🗑️</span>
                    <span>Delete For Me</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

     
      {currentUserData && (
        <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border-light)" }}>
          <div className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors"
            style={{ background: "var(--primary-soft)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--border-light)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--primary-soft)"}
            onClick={() => setShowSettings(true)}
          >

            <div className="relative">
              <img 
                src={getAvatarUrl(currentUserData.avatarFileID, currentUserData.username)} 
                className="w-10 h-10 rounded-2xl object-cover shadow-sm"
                alt=""
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getAvatarUrl(null, currentUserData.username);
                }}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[var(--bg-sidebar)] rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "var(--text-main)" }}>{currentUserData.username}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>Profile & Settings</p>
            </div>
            <span style={{ color: "var(--primary)" }}>⚙️</span>

          </div>
        </div>
      )}

      {showSettings && (
        <SettingsModal 
          user={currentUserData} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};


export default Sidebar;


