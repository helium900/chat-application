import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { account } from "../appwriteConfig";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUser,
  setUsernameThunk,
  uploadAvatarThunk,
} from "../store/userSlice";
import { getAvatarUrl } from "../api/avatarApi";

const SetUsername = () => {
  const [username, setUsernameInput] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  const [userId, setUserId] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const users = useSelector((state) => state.users.users);

  const isValidImage = (file) => {
    return ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type);
  };

  // ✅ INIT (Redux based)
  useEffect(() => {
    const init = async () => {
      try {
        const authUser = await account.get();
        setUserId(authUser.$id);

        const res = await dispatch(fetchUser(authUser.$id));

        if (res.meta.requestStatus === "rejected") {
          throw new Error("Failed to fetch user");
        }

        const dbUser = res.payload;

        if (dbUser.username) {
          navigate("/chat");
        }

        setPreview(
          getAvatarUrl(dbUser.avatarFileID, dbUser.username || "User")
        );
      } catch (err) {
        navigate("/login");
      } finally {
        setChecking(false);
      }
    };

    init();
  }, []);

  // ✅ Handle image select
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isValidImage(file)) {
      setError("Only image files allowed");
      setPreview(null);
      setAvatarFile(null);
      return;
    }

    setError("");
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!isValidImage(file)) {
      setError("Only image files allowed");
      setPreview(null);
      setAvatarFile(null);
      return;
    }

    setError("");
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // ✅ Submit (Redux)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ✅ Step 1: set username
      const res1 = await dispatch(
        setUsernameThunk({ userId, username })
      );

      if (res1.meta.requestStatus === "rejected") {
        throw new Error(res1.payload || "Username failed");
      }

      // ✅ Step 2: upload avatar (optional)
      if (avatarFile) {
        const oldAvatarId = users[userId]?.avatarFileID;

        const res2 = await dispatch(
          uploadAvatarThunk({
            file: avatarFile,
            userId,
            oldFileId: oldAvatarId,
          })
        );

        if (res2.meta.requestStatus === "rejected") {
          throw new Error(res2.payload || "Avatar upload failed");
        }
      }

      navigate("/chat");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 400, margin: "auto", textAlign: "center" }}>
      <h2>Setup Profile</h2>

      {/* ✅ Avatar Preview */}
      {preview && (
        <img
          src={preview}
          alt="avatar"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: 10,
          }}
        />
      )}

      {/* ✅ Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: "2px dashed gray",
          padding: 20,
          borderRadius: 10,
          background: dragging ? "#eee" : "transparent",
          cursor: "pointer",
          marginBottom: 10,
        }}
      >
        <p>
          {dragging
            ? "Drop image here 👇"
            : preview
            ? "Change avatar"
            : "Drag & drop avatar or click"}
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="fileInput"
        />

        <label htmlFor="fileInput" style={{ color: "blue", cursor: "pointer" }}>
          Choose File
        </label>
      </div>

      {/* ✅ Form */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsernameInput(e.target.value)}
          disabled={loading}
          required
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
          }}
        />

        {/* ✅ ERROR ABOVE BUTTON */}
        {error && (
          <p style={{ color: "red", marginBottom: 10 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            cursor: "pointer",
          }}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
};

export default SetUsername;