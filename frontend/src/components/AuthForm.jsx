// src/components/AuthForm.jsx
import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../context/AuthProvider";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const AuthForm = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState(null);
  const [role, setRole] = useState("reader"); // default to reader
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") {
        await handleLogin();
      } else {
        await handleSignup();
      }
    } catch (err) {
      setError(`${t('auth.authenticationFailed')} ${err.response?.data?.message || ""}`);
    }
  };
  
  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:8001/api/auth/login", {
        email,
        password,
      });
      login(res.data.access_token, { email });
    } catch (err) {
      console.error(t('auth.loginFailed'), err);
      throw err;
    }
  };
  
  const handleSignup = async () => {
    try {
      const res = await axios.post("http://localhost:8001/api/auth/signup", {
        email,
        password,
        role,
      });
      const token = res.data.access_token;
      const decoded = jwtDecode(token);
      const user = {
        email: decoded.sub,
        role: decoded.role,
      };
      login(token, user); // sets context + localStorage
    } catch (err) {
      console.error(t('auth.signupFailed'), err);
      console.error("Server says:", err.response.data);
      alert(t('auth.signupFailed'));
      throw err;
    }
  };
  
  return (
    <div className="flex justify-center items-center h-screen bg-app">
      <div className="card w-full max-w-md">
        <h2 className="text-heading text-2xl font-bold mb-4 text-center">
          {mode === "login" ? t('auth.login') : t('auth.signup')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="input-base w-full"
            placeholder={t('auth.email')}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input-base w-full"
            placeholder={t('auth.password')}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === "signup" && (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-base w-full"
              aria-label={t('auth.selectRole')}
            >
              <option value="reader">{t('auth.reader')}</option>
              <option value="admin">{t('auth.admin')}</option>
            </select>
          )}
          <button
            type="submit"
            className="btn-primary w-full"
          >
            {mode === "login" ? t('auth.loginButton') : t('auth.signupButton')}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-body">
          {mode === "login" ? t('auth.noAccount') : t('auth.hasAccount')}{" "}
          <button
            className="text-dark hover:underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? t('auth.switchToSignup') : t('auth.switchToLogin')}
          </button>
        </p>
        {error && (
          <p className="error text-center mt-2 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;