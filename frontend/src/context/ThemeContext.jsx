import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { getUserSettings, updateUserSettings } from "../services/settingsService";
import { useAuth } from "./AuthProvider";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { token } = useAuth();
  const [theme, setThemeState] = useState("light");
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);
  const lastTokenRef = useRef(null);
  const isUpdatingRef = useRef(false);

  // Cargar tema desde el backend al iniciar
  useEffect(() => {
    const fetchSettings = async () => {
      // Evitar múltiples llamadas para el mismo token
      if (!token || hasInitialized.current || lastTokenRef.current === token) {
        if (!token) setIsLoading(false);
        return;
      }

      hasInitialized.current = true;
      lastTokenRef.current = token;

      try {
        setIsLoading(true);
        const settings = await getUserSettings(token);
        if (settings && settings.theme) {
          setThemeState(settings.theme);
        }
      } catch (error) {
        console.error("Error al cargar el tema:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

  // Reset solo cuando cambia el token
  useEffect(() => {
    if (!token) {
      hasInitialized.current = false;
      lastTokenRef.current = null;
    }
  }, [token]);

  // Guardar tema en el backend cuando cambia
  const setTheme = async (newTheme) => {
    // Prevenir múltiples actualizaciones simultáneas
    if (isUpdatingRef.current || newTheme === theme || isLoading) {
      return;
    }

    isUpdatingRef.current = true;
    setThemeState(newTheme);

    if (token) {
      try {
        await updateUserSettings({ theme: newTheme }, token);
      } catch (error) {
        console.error("Error al guardar el tema:", error);
        // Revertir cambio local en caso de error
        setThemeState(theme);
      } finally {
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }
    }
  };

  // Aplicar tema al documento
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        theme === "dark" ? "#0f172a" : "#ffffff"
      );
    }
  }, [theme]);

  // Escuchar cambios en la preferencia del sistema
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = (e) => {
        if (!isLoading) {
          setTheme(e.matches ? "dark" : "light");
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [isLoading]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === "dark",
    isLight: theme === "light",
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};