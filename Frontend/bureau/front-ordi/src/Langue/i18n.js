import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { resources } from './dictionnaire_Accueil_Profil'; 
import { resources_connexion } from './dictionnaire_Connexion'; 

// Fusion des dictionnaires
const combinedResources = {
  Français: {
    translation: {
      ...resources.Français.translation,
      ...resources_connexion.Français.translation,
    }
  },
  English: {
    translation: {
      ...resources.English.translation,
      ...resources_connexion.English.translation,
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: combinedResources, // On utilise l'objet fusionné
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    lng: localStorage.getItem('i18nextLng') || 'Français', 
    fallbackLng: "Français",
    interpolation: { escapeValue: false }
  });

export default i18n;