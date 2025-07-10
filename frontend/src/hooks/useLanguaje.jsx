// src/hooks/useLanguage.js
import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
  };

  const getCurrentLanguage = () => {
    return i18n.language;
  };

  const getAvailableLanguages = () => {
    return [
      { code: 'es', name: t('languages.spanish'), flag: '🇪🇸' },
      { code: 'en', name: t('languages.english'), flag: '🇺🇸' },
      { code: 'fr', name: t('languages.french'), flag: '🇫🇷' }
    ];
  };

  return {
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
    currentLanguage: i18n.language,
    t
  };
};