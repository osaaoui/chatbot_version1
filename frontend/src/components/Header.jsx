// src/components/Header.jsx
import React from "react";
import { useAuth } from "../context/AuthProvider"; // ✅ working one

const Header = () => {
  const { user, logout } = useAuth(); // ✅ get the `user` object

  if (!user) return null; // no user means not logged in

  return (
    <div style={{ padding: "0.5rem 1rem", background: "#f1f1f1" }}>
      Logged in as <strong>{user.email}</strong>
      <button style={{ marginLeft: "1rem" }} onClick={logout}>
        Logout
      </button>
    </div>
  );
};

export default Header;