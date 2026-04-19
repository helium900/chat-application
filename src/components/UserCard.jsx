import { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { getAvatarUrl } from "../api/avatarApi";

const UserCard = ({ user, buttonLabel, onButtonClick, isCurrentUser, isEditable, onAvatarChange, hideAction }) => {
  const [isMagnified, setIsMagnified] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const onlineUsers = useSelector((state) => state.presence?.onlineUsers || {});
  const isOnline = onlineUsers[user.$id] === "online";

  const toggleMagnify = () => setIsMagnified(!isMagnified);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      if (onAvatarChange) onAvatarChange(file);
    }
  };

  return (
    <div className="user-card animate-slide-up font-inter flex flex-col items-center">
      <div className="relative mb-8 group flex justify-center">
        <div className="relative">
          <img
            src={preview || getAvatarUrl(user.avatarFileID, user.username)}
            alt={user.username}
            className={`w-32 h-32 lg:w-36 lg:h-36 rounded-2xl object-cover shadow-sm transition-all duration-300 ${!isEditable && "hover:scale-105 cursor-pointer"}`}
            style={{ border: "4px solid var(--border-light)" }}

            onClick={!isEditable ? toggleMagnify : undefined}
            onError={(e) => {
              console.error("Avatar failed to load. URL was:", preview || getAvatarUrl(user.avatarFileID, user.username));
              e.target.onerror = null; 
              e.target.src = getAvatarUrl(null, user.username);
            }}
          />
          
          {isEditable && (
            <label className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-1 text-white">
                <span className="text-xl">📷</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest">Change</span>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </label>
          )}

          {!isEditable && (
            <div 
              className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 rounded-full transition-colors duration-500 ${
                onlineUsers[user.$id] === "online" ? "bg-green-500" : "bg-zinc-700"
              }`}
              style={{ borderColor: "var(--bg-card)" }}

              title={onlineUsers[user.$id] || "offline"}
            ></div>
          )}
        </div>
      </div>

      <div className="text-center w-full mb-10">
        <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight mb-1 truncate px-4">
          {user.username}
        </h2>

        {!hideAction && (
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
            {isCurrentUser ? "Your Profile" : "Member"}
          </p>
        )}

      </div>

      {!hideAction && (
        <button
          onClick={onButtonClick}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.96] shadow-sm ${
            isCurrentUser 
              ? "bg-red-900/20 text-red-500 hover:bg-red-900/30" 
              : "text-white"
          }`}
          style={!isCurrentUser ? { background: "linear-gradient(135deg, var(--primary), var(--accent))" } : {}}
        >

          <span className="text-xl">{isCurrentUser ? "🚪" : "💬"}</span>
          <span>{buttonLabel}</span>
        </button>
      )}

      {isMagnified && !isEditable && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-[2000] p-4 animate-in fade-in"
          onClick={toggleMagnify}
        >
          <div className="relative max-w-full w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <img
              src={preview || getAvatarUrl(user.avatarFileID, user.username)}
              alt={user.username}
              className="w-full h-auto aspect-square rounded-2xl border-8 border-black shadow-2xl object-cover animate-in zoom-in duration-300"
            />

            <button 
              className="absolute -top-4 -right-4 bg-zinc-900 text-white rounded-full p-2 shadow-xl text-xl font-bold"
              onClick={toggleMagnify}
            >
              ✕
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default UserCard;
