// src/components/AuthForm.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthProvider"; // ✅ working one
import axios from "axios";

const AuthForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // or 'signup'
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  try {
    await handleLogin(); // ✅ this makes the actual request and calls login()
  } catch (err) {
    setError("Failed to authenticate.");
  }
};
  const handleLogin = async () => {
  try {
    const res = await axios.post("http://localhost:8000/api/auth/login", {
      email,
      password,
    });

    login(res.data.access_token, { email }); // 👈 this triggers re-render
  } catch (err) {
    console.error("Login failed", err);
  }
};


  return (
    <div style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h2>{mode === "login" ? "Log In" : "Sign Up"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br />
        <input
          placeholder="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br />
        <button type="submit">{mode === "login" ? "Login" : "Signup"}</button>
      </form>
      <p>
        {mode === "login" ? "No account?" : "Already have one?"}{" "}
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          Switch to {mode === "login" ? "Signup" : "Login"}
        </button>
      </p>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default AuthForm;
