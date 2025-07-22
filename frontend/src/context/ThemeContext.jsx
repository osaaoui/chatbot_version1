import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("app-theme")
      if (savedTheme) {
        return savedTheme
      }
      
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark"
      }
    }
    return "light"
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("app-theme", theme)
    }
    
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
    
    const metaThemeColor = document.querySelector("meta[name=\"theme-color\"]")
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", theme === "dark" ? "#0f172a" : "#ffffff")
    }
  }, [theme])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      
      const handleChange = (e) => {
        const savedTheme = localStorage.getItem("app-theme")
        if (!savedTheme) {
          setTheme(e.matches ? "dark" : "light")
        }
      }

      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === "light" ? "dark" : "light")
  }

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === "dark",
    isLight: theme === "light"
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}