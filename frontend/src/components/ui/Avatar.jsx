import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Avatar = ({ 
  name = "", 
  size = "w-10 h-10",
  menuItems = [],
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { t, i18n } = useTranslation();
  
  const getInitial = (name) => name.charAt(0).toUpperCase() + name.charAt(1).toUpperCase();
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'es', name: t('languages.spanish'), flag: '🇪🇸' },
    { code: 'en', name: t('languages.english'), flag: '🇺🇸' },
    { code: 'fr', name: t('languages.french'), flag: '🇫🇷' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setIsLanguageOpen(false);
    setIsOpen(false);
  };
  
  const defaultItems = [
    { label: t('avatar.myProfile'), onClick: () => console.log('Perfil') },
    { label: 'Configuración', onClick: () => console.log('Configuración') },
    { label: 'Ayuda', onClick: () => console.log('Ayuda') },
    { separator: true },
    { label: t('avatar.logout'), onClick: () => console.log('Logout') }
  ];
  
  const items = menuItems.length > 0 ? menuItems : defaultItems;
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${size} rounded-full bg-secondary text-heading font-semibold flex items-center justify-center hover:bg-bg-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-primary`}
      >
        {getInitial(name)}
      </button>
      
      {isOpen && (
        <div className="absolute z-[9999] right-0 mt-2 w-48 bg-white border border-light rounded-lg shadow-lg py-1">
          {/* Selector de idioma */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLanguageOpen(!isLanguageOpen);
              }}
              className="w-full text-left px-4 py-2 text-sm text-body hover:bg-tertiary transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <span className="mr-2">{currentLanguage.flag}</span>
                <span>{t('avatar.language')}</span>
              </div>
              <svg 
                className={`w-4 h-4 transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isLanguageOpen && (
              <div className="absolute left-0 top-0 w-full bg-white border border-light rounded-lg shadow-lg py-1 z-10">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => changeLanguage(language.code)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-tertiary transition-colors flex items-center ${
                      i18n.language === language.code ? 'bg-tertiary font-medium' : 'text-body'
                    }`}
                  >
                    <span className="mr-2">{language.flag}</span>
                    <span>{language.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <hr className="my-1 border-light" />
          
          {/* Elementos del menú existentes */}
          {items.map((item, index) => (
            item.separator ? (
              <hr key={index} className="my-1 border-light" />
            ) : (
              <button
                key={index}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  }
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-body hover:bg-tertiary transition-colors"
              >
                {item.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default Avatar;