// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar traducciones
import translationES from './locales/es.json';
import translationEN from './locales/en.json';
import translationFR from './locales/fr.json';

const resources = {
  es: {
    translation: translationES
  },
  en: {
    translation: translationEN
  },
  fr: {
    translation: translationFR
  }
};

i18n
  .use(LanguageDetector) // Detecta el idioma del navegador
  .use(initReactI18next) // Inicializa react-i18next
  .init({
    resources,
    fallbackLng: 'es', // Idioma por defecto
    debug: false, // Cambiar a true para debug en desarrollo
    
    // Opciones del detector de idioma
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false // React ya se encarga del escape
    },

    // Namespace por defecto
    defaultNS: 'translation',
    ns: ['translation']
  });

export default i18n;