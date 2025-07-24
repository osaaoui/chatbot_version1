import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getUserSettings, updateUserSettings } from '../services/settingsService';
import { useAuth } from './AuthProvider';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { token } = useAuth();
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState('es');
  const [isLoading, setIsLoading] = useState(true);
  const isUpdatingRef = useRef(false);
  const hasInitialized = useRef(false);
  const lastTokenRef = useRef(null);

  // Cargar idioma desde el backend - solo una vez por token
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
        if (settings && settings.language) {
          // Solo actualizar si el idioma es diferente
          if (language !== settings.language) {
            setLanguageState(settings.language);
          }
          // Solo cambiar i18n si es diferente
          if (i18n.language !== settings.language) {
            await i18n.changeLanguage(settings.language);
          }
        }
      } catch (error) {
        console.error("Error al cargar el idioma:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [token]); // Eliminar i18n y language de las dependencias

  // Reset solo cuando cambia el token
  useEffect(() => {
    if (!token) {
      hasInitialized.current = false;
      lastTokenRef.current = null;
    }
  }, [token]);

  // Setter personalizado con guardado en backend
  const setLanguage = async (lang) => {
    // Prevenir múltiples actualizaciones simultáneas
    if (isUpdatingRef.current || lang === language || isLoading) {
      return;
    }

    isUpdatingRef.current = true;
    
    try {
      // Actualizar estado local primero
      setLanguageState(lang);
      
      // Cambiar idioma en i18n solo si es diferente
      if (i18n.language !== lang) {
        await i18n.changeLanguage(lang);
      }
      
      // Guardar en backend solo si hay token y no estamos cargando
      if (token) {
        await updateUserSettings({ language: lang }, token);
      }
    } catch (error) {
      console.error("Error al guardar el idioma:", error);
      // Revertir cambio local en caso de error
      setLanguageState(language);
    } finally {
      // Usar setTimeout para evitar condiciones de carrera
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe ser utilizado dentro de un LanguageProvider');
  }
  return context;
};