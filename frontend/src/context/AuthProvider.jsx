// src/context/AuthProvider.js
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Función para procesar autenticación desde URL
  const processAuthFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const urlToken = urlParams.get('token');
    const urlUser = urlParams.get('user');

    if (authStatus === 'success' && urlToken && urlUser) {
      try {
        // Decodificar los datos
        const decodedToken = decodeURIComponent(urlToken);
        const decodedUser = JSON.parse(decodeURIComponent(urlUser));

        // Guardar en localStorage
        localStorage.setItem("token", decodedToken);
        localStorage.setItem("user", JSON.stringify(decodedUser));

        // Actualizar estado
        setToken(decodedToken);
        setUser(decodedUser);

        // Limpiar la URL sin recargar la página
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        console.log('Autenticación exitosa desde Astro:', { token: decodedToken, user: decodedUser });
        
        return true; // Indica que se procesó la autenticación desde URL
      } catch (error) {
        console.error('Error procesando autenticación desde URL:', error);
        // Si hay error, limpiar parámetros de la URL
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
    return false;
  };

  useEffect(() => {
    // Primero intentar procesar desde URL
    const authFromURL = processAuthFromURL();
    
    // Si no hay autenticación desde URL, intentar desde localStorage
    if (!authFromURL) {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          // Limpiar datos corruptos
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
    }
    
    setLoaded(true);
  }, []);

  const login = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loaded }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);