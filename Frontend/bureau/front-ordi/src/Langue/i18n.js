import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resources } from "./dictionnaire_Accueil_Profil";
import { resources_connexion } from "./dictionnaire_Connexion";
import { resources_inscription } from "./dictionnaire_inscription";
import { resources_jeu } from "./dictionnaire_Jeu";

// Fusion des différents dictionnaires de traduction par langue
const combinedResources = {
  fr: {
    translation: {
      ...resources.fr?.translation,
      ...resources_connexion.fr?.translation,
      ...resources_inscription.fr?.translation,
      ...resources_jeu.fr?.translation,
    },
  },
  en: {
    translation: {
      ...resources.en?.translation,
      ...resources_connexion.en?.translation,
      ...resources_inscription.en?.translation,
      ...resources_jeu.en?.translation,
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: combinedResources,
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    lng: localStorage.getItem("i18nextLng") || "fr",
    fallbackLng: "fr",
    interpolation: { escapeValue: false },
  });

export default i18n;
