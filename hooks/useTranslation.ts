
import { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../constants';
import type { Language } from '../types';

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const { language, changeLanguage } = context;

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return { t, language, changeLanguage };
};
