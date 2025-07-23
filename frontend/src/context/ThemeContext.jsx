import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserSettings, updateUserSettings } from "../services/settingsService";
import { useAuth } from "./AuthProvider";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const { token } = useAuth();
  const [theme, setThemeState] = useState("light");
  const [isLoading, setIsLoading] = useState(true);

  // Cargar tema desde el backend al iniciar
  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const settings = await getUserSettings(token);
        if (settings && settings.theme) {
          setThemeState(settings.theme);
        } else {
          // Usar preferencia del sistema si no hay tema guardado
          const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
          setThemeState(prefersDark ? "dark" : "light");
        }
      } catch (error) {
        console.error("Error al cargar el tema:", error);
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        setThemeState(prefersDark ? "dark" : "light");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [token]);

  // Guardar tema en el backend cuando cambia
  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    
    if (token && !isLoading) {
      try {
        await updateUserSettings({ theme: newTheme }, token);
      } catch (error) {
        console.error("Error al guardar el tema:", error);
      }
    }
  };

  // Aplicar tema al documento
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    const metaThemeColor = document.querySelector("meta[name=\"theme-color\"]");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", theme === "dark" ? "#0f172a" : "#ffffff");
    }
  }, [theme]);

  // Escuchar cambios en la preferencia del sistema
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      const handleChange = (e) => {
        // Cambiar solo si el usuario no ha establecido su preferencia explícitamente
        if (isLoading) {
          setThemeState(e.matches ? "dark" : "light");
        }
      }

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
    isLoading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};