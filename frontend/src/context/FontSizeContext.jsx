import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getUserSettings, updateUserSettings } from '../services/settingsService';
import { useAuth } from './AuthProvider';

const FontSizeContext = createContext();

export const FontSizeProvider = ({ children }) => {
  const { token } = useAuth();
  const [fontSize, setFontSizeState] = useState(16);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef(null);

  // Cargar tamaño de fuente desde el backend
  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const settings = await getUserSettings(token);
        if (settings && settings.font_size) {
          setFontSizeState(settings.font_size);
        }
      } catch (error) {
        console.error("Error al cargar el tamaño de fuente:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [token]);

  // Setter personalizado con debounce
  const setFontSize = (size) => {
    setFontSizeState(size);
    
    // Limpiar timeout existente
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Configurar nuevo timeout de 3 segundos
    saveTimeoutRef.current = setTimeout(() => {
      if (token) {
        updateUserSettings({ font_size: size }, token).catch(error => {
          console.error("Error al guardar el tamaño de fuente:", error);
        });
      }
    }, 3000);
  };

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, isLoading }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error('useFontSize debe ser utilizado dentro de un FontSizeProvider');
  }
  return context;
};