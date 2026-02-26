import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { resources } from './dictionnaire'; 

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources, 
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    lng: localStorage.getItem('i18nextLng') || 'Français', 
    fallbackLng: "Français",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;