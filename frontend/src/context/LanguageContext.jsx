import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserSettings, updateUserSettings } from '../services/settingsService';
import { useAuth } from './AuthProvider';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { token } = useAuth();
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState('es');
  const [isLoading, setIsLoading] = useState(true);

  // Cargar idioma desde el backend
  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const settings = await getUserSettings(token);
        if (settings && settings.language) {
          setLanguageState(settings.language);
          i18n.changeLanguage(settings.language);
        }
      } catch (error) {
        console.error("Error al cargar el idioma:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [token, i18n]);

  // Setter personalizado con guardado en backend
  const setLanguage = async (lang) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    
    if (token && !isLoading) {
      try {
        await updateUserSettings({ language: lang }, token);
      } catch (error) {
        console.error("Error al guardar el idioma:", error);
      }
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