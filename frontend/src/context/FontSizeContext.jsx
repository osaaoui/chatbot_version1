import React, { createContext, useContext, useState, useEffect } from 'react';

const FontSizeContext = createContext();

export const FontSizeProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('chatFontSize');
    return saved ? parseInt(saved) : 16;
  });

  useEffect(() => {
    localStorage.setItem('chatFontSize', fontSize.toString());
  }, [fontSize]);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
};