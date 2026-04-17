import { useState } from "react";
import { signup } from "../api/authApi"; // ⚠️ signup from auth
import { useNavigate } from "react-router-dom";


const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ✅ Step 1: create auth account + session
      await signup({ email, password });

      // ✅ Step 4: go to username setup
      navigate("/setUsername");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Signup</h2>

    

      <form onSubmit={handleSignup}>
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

         {/* ✅ Error UI */}
      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Signup"}
        </button>
      </form>
    </div>
  );
};

export default Signup;