import { useState } from "react";
import { login } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { account } from "../appwriteConfig";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser } from "../store/userSlice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const users = useSelector((state) => state.users.users);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Step 1: login
      await login({ email, password });

      // ✅ Step 2: get auth user
      const user = await account.get();

      // ✅ Step 3: fetch user into Redux
      const res = await dispatch(fetchUser(user.$id));

      if (res.meta.requestStatus === "rejected") {
        setError("Failed to fetch user");
      }

      const dbUser = res.payload;

      // ✅ Step 4: route based on username
      if (!dbUser.username) {
        navigate("/setUsername");
      } else {
        navigate("/chat");
      }

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
  <p style={{ color: "red" }}>
    {error}
  </p>
)}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;