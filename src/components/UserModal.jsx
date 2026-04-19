import ReactDOM from "react-dom";
import UserCard from "./UserCard";
import { logout } from "../api/authApi";
import { useNavigate } from "react-router-dom";

const UserModal = ({ user, onClose, onChat, isCurrentUser, hideAction }) => {
  const navigate = useNavigate();
  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>
        <UserCard
          user={user}
          buttonLabel={isCurrentUser ? "Logout" : "Start Chatting"}
          onButtonClick={() => {
            if (isCurrentUser) {
              handleLogout();
            } else {
              onChat(user);
            }
            onClose();
          }}
          isCurrentUser={isCurrentUser}
          hideAction={hideAction}
        />
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default UserModal;
