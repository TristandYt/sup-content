import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { resources } from './dictionnaire_Accueil_Profil'; 
import { resources_connexion } from './dictionnaire_Connexion'; 
import { resources_inscription } from './dictionnaire_inscription';

// Fusion des dictionnaires
const combinedResources = {
  Français: {
    translation: {
      ...resources.Français.translation,
      ...resources_connexion.Français.translation,
      ...resources_inscription.Français.translation,
    }
  },
  English: {
    translation: {
      ...resources.English.translation,
      ...resources_connexion.English.translation,
      ...resources_inscription.English.translation,
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