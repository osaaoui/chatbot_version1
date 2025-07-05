// src/components/AuthForm.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthProvider";
import axios from "axios";

const AuthForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await handleLogin();
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
      login(res.data.access_token, { email });
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {mode === "login" ? "Log In" : "Sign Up"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded"
            placeholder="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded"
            placeholder="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            {mode === "login" ? "Login" : "Signup"}
          </button>
        </form>
        <p className="text-center mt-4 text-sm">
          {mode === "login" ? "No account?" : "Already have one?"}{" "}
          <button
            className="text-blue-600 hover:underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            Switch to {mode === "login" ? "Signup" : "Login"}
          </button>
        </p>
        {error && (
          <p className="text-red-500 text-center mt-2 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
