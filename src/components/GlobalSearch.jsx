import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { searchUser } from "../api/userApi";
import { account } from "../appwriteConfig";
import { getAvatarUrl } from "../api/avatarApi";
import UserModal from "./UserModal";

const GlobalSearch = ({ onChatStart }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const onlineUsers = useSelector((state) => state.presence?.onlineUsers || {});

  useEffect(() => {
    account.get().then(user => setCurrentUserId(user.$id)).catch(() => {});
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        setLoading(true);
        try {
          const users = await searchUser(query);
          setResults(users);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="relative w-full">
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300 transition-colors">
          🔍
        </div>
        <input
          type="text"
          placeholder="Search people..."
          className="w-full border border-transparent focus:border-zinc-800 rounded-xl pl-11 pr-10 py-3 text-sm font-medium placeholder-zinc-500 transition-all outline-none"
          style={{ background: "var(--primary-soft)", color: "var(--text-main)" }}

          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {loading ? (
            <div className="animate-spin h-4 w-4 border-2 rounded-full" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}></div>
          ) : query && (
            <button onClick={() => { setQuery(""); setResults([]); }} style={{ color: "var(--text-muted)" }}>✕</button>
          )}
        </div>

      </div>

      {results.length > 0 && (
        <div
          className="absolute left-0 right-0 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] max-h-[400px] overflow-y-auto py-3 animate-slide-up"
          style={{ top: "calc(100% + 12px)", zIndex: 9999, background: "var(--bg-card)", border: "1px solid var(--border-light)" }}
        >
          <div className="px-5 pb-2 mb-2 border-b" style={{ borderColor: "var(--border-light)" }}>
             <p className="text-[9px] font-extrabold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>Search Results</p>
          </div>

          {results.map((user) => (
            <div
              key={user.$id}
              onClick={() => setSelectedUser(user)}
              className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-all group border-b last:border-0"
              style={{ borderColor: "var(--border-light)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--border-light)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >


              <div className="relative flex-shrink-0">
                <img
                  src={getAvatarUrl(user.avatarFileID, user.username)}
                  alt=""
                  className="w-10 h-10 rounded-2xl object-cover shadow-sm"
                />
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 rounded-full transition-colors duration-500 ${
                  onlineUsers[user.$id] === "online" ? "bg-green-500" : "bg-zinc-700"
                }`} style={{ borderColor: "var(--bg-card)" }}></div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "var(--text-main)" }}>
                  {user.username} {user.$id === currentUserId && "(You)"}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
                  {user.$id === currentUserId ? "Your Profile" : "User"}
                </p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold" style={{ color: "var(--primary)" }}>
                View ➡️
              </div>

            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <UserModal
          user={selectedUser}
          isCurrentUser={selectedUser.$id === currentUserId}
          onClose={() => {
            setSelectedUser(null);
            setQuery("");
            setResults([]);
          }}
          onChat={(user) => {
            onChatStart(user);
            setQuery("");
            setResults([]);
          }}
        />
      )}
    </div>
  );
};

export default GlobalSearch;
