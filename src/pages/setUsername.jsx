import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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

  useEffect(() => {
    const init = async () => {
      try {
        const authUser = await account.get();
        setUserId(authUser.$id);
        const res = await dispatch(fetchUser(authUser.$id));
        if (res.meta.requestStatus === "rejected") throw new Error("Failed to fetch user");

        const dbUser = res.payload;
        if (dbUser.username) navigate("/chat");

        setPreview(getAvatarUrl(dbUser.avatarFileID, dbUser.username || "User"));
      } catch {
        navigate("/login");
      } finally {
        setChecking(false);
      }
    };
    init();
  }, [dispatch, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!isValidImage(file)) {
      setError("Only image files allowed");
      return;
    }
    setError("");
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file || !isValidImage(file)) return;
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res1 = await dispatch(setUsernameThunk({ userId, username }));
      if (res1.meta.requestStatus === "rejected") throw new Error(res1.payload || "Username failed");

      if (avatarFile) {
        const oldAvatarId = users[userId]?.avatarFileID;
        const res2 = await dispatch(uploadAvatarThunk({ file: avatarFile, userId, oldFileId: oldAvatarId }));
        if (res2.meta.requestStatus === "rejected") {
          throw new Error(res2.payload || "Failed to upload avatar");
        }
      }
      navigate("/chat");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-10 w-10 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Checking Profile...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] px-4 py-12 relative overflow-hidden">
      {/* CLEAN BACKGROUND */}

      <div className="w-full max-w-md glass-card p-10 relative z-10 animate-slide-up text-center border-white/40">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[var(--primary)] text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-purple-500/30 mb-6">
            <span className="text-4xl">✨</span>
          </div>
          <h2 className="text-4xl font-extrabold text-[var(--text-main)] mb-2 tracking-tight">Personalize</h2>
          <p className="text-zinc-500 font-medium text-center">Set up your profile to start chatting</p>
        </div>


        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div
                className={`w-36 h-36 rounded-2xl border-4 ${dragging ? 'border-[var(--primary)] bg-[var(--primary-soft)]' : 'border-black'} shadow-2xl overflow-hidden transition-all duration-300 transform group-hover:scale-105 group-hover:rotate-3`}

                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                {preview ? (
                  <img src={preview} alt="avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300 text-6xl">

                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]">
                  <div className="flex flex-col items-center gap-2 text-white">
                    <span className="text-2xl">📷</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">Update Photo</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[var(--primary)] text-white p-2 rounded-xl shadow-lg border-2 border-black text-sm">
                📷
              </div>

            </div>
            <p className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-[0.2em]">Profile Picture</p>
          </div>


          <div className="space-y-6">
            <div className="space-y-2 group text-left">
              <label className="text-sm font-bold text-zinc-400 ml-1 group-focus-within:text-[var(--primary)] transition-colors">Your Username</label>

              <div className="relative">
                <input
                  type="text"
                  placeholder="how do we call you?"
                  className="input-modern"
                  value={username}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-900/20 text-red-500 rounded-2xl text-sm font-bold flex items-center gap-3 border border-red-900/30 shadow-sm">
                <span className="text-xl">⚠️</span>
                {error}
              </div>
            )}


            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-5 text-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">✅</span>
                  <span>Complete Setup</span>
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-center mt-10 text-zinc-500 font-medium text-sm">
          Not your account?{" "}
          <Link to="/login" className="text-[var(--primary)] hover:underline font-bold transition-colors">
            Switch Account
          </Link>
        </p>

      </div>
    </div>
  );
};

export default SetUsername;