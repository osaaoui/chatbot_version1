// src/components/Header.jsx
import React from "react";
import { useAuth } from "../context/AuthProvider";

const Header = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-gray-100 border-b">

      {/* Left: (can stay empty or hold app title if needed) */}
      <div />

      {/* Right: User info + Logout */}
      <div className="text-sm text-gray-700">
        Logged in as <strong>{user.email}</strong>
        <button
          onClick={logout}
          className="ml-3 text-red-500 hover:underline text-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
