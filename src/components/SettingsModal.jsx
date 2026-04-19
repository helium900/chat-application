import { useState } from "react";
import ReactDOM from "react-dom";
import UserCard from "./UserCard";
import { logout } from "../api/authApi";
import { uploadAvatar } from "../api/avatarApi";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { uploadAvatarThunk } from "../store/userSlice";

const SettingsModal = ({ user, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleAvatarChange = async (file) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await dispatch(uploadAvatarThunk({ file, userId: user.$id, oldFileId: user.avatarFileID }));
      
      if (res.meta.requestStatus === "rejected") {
        setError(res.payload || "Failed to update avatar");
      } else {
        setSuccess("Profile picture updated!");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const modal = (
    <div className="modal-overlay animate-in fade-in duration-300" onClick={onClose}>
      <div className="modal-content animate-in zoom-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl text-xl flex items-center justify-center" style={{ background: "var(--primary-soft)", color: "var(--text-main)", border: "1px solid var(--border-light)" }}>
            {loading ? (
               <div className="animate-spin h-5 w-5 border-2 rounded-full" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}></div>
            ) : "⚙️"}
          </div>
          <h3 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-main)" }}>Settings</h3>
        </div>


        {error && <p className="text-xs font-bold text-red-500 mb-4 text-center bg-red-900/20 p-2 rounded-lg">❌ {error}</p>}
        {success && <p className="text-xs font-bold text-green-500 mb-4 text-center bg-green-900/20 p-2 rounded-lg">✅ {success}</p>}


        <UserCard 
          user={user} 
          buttonLabel="Logout" 
          onButtonClick={handleLogout} 
          isCurrentUser={true}
          isEditable={true}
          onAvatarChange={handleAvatarChange}
        />

        <p className="mt-6 text-[10px] text-center font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
          Tap photo to change
        </p>

      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default SettingsModal;
