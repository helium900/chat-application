import { useState } from "react";
import { login } from "../api/authApi";
import { useNavigate, Link } from "react-router-dom";
import { account } from "../appwriteConfig";
import { useDispatch } from "react-redux";
import { fetchUser } from "../store/userSlice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login({ email: email.trim(), password });
      const user = await account.get();
      const res = await dispatch(fetchUser(user.$id));

      if (res.meta.requestStatus === "rejected") {
        setError(res.payload || res.error?.message || "Failed to fetch user profile");
        return;
      }

      const dbUser = res.payload;
      if (!dbUser.username) {
        navigate("/setUsername");
      } else {
        navigate("/chat");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="min-h-screen w-full flex items-center justify-center font-inter text-[var(--text-sub)] relative"
      style={{ background: "radial-gradient(circle at top right, rgba(168, 85, 247, 0.15), transparent 400px), radial-gradient(circle at bottom left, rgba(236, 72, 153, 0.15), transparent 400px), var(--bg-app)" }}>
      <div className="w-full max-w-[440px] bg-[var(--bg-card)] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-12 border border-[var(--border-light)] animate-slide-up text-center relative z-10 backdrop-blur-xl">


        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[var(--primary)] text-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <span className="text-3xl">💬</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">Welcome Back</h2>
        </div>


        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest ml-1">Email</label>

            <input
              type="email"
              placeholder="Email address"
              className="w-full px-6 py-4 rounded-2xl bg-[var(--primary-soft)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:bg-[var(--bg-app)] outline-none transition-all font-semibold text-white"

              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest ml-1">Password</label>

            <input
              type="password"
              placeholder="Password"
              className="w-full px-6 py-4 rounded-2xl bg-[var(--primary-soft)] border border-[var(--border-light)] focus:border-[var(--primary)] focus:bg-[var(--bg-app)] outline-none transition-all font-semibold text-white"

              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 text-red-500 rounded-2xl text-xs font-bold border border-red-900/30">
              {error}
            </div>
          )}


          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        <div className="mt-8">
          <Link 
            to="/signup" 
            className="text-sm font-bold text-zinc-500 hover:text-white transition-colors"
          >
            Don't have an account? <span className="text-[var(--primary)] underline">Sign up</span>
          </Link>

        </div>
      </div>
    </div>
  );
};

export default Login;
