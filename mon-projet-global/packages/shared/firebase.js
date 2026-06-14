import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  browserLocalPersistence,
  setPersistence,
  GoogleAuthProvider,
  GithubAuthProvider
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { FIREBASE_FIRESTORE_IP, FIREBASE_FIRESTORE_PORT, FIREBASE_AUTH_URL } from "./config";

const firebaseConfig = {
  apiKey: "fake-api-key",
  authDomain: "localhost",
  projectId: "sup-content-tristan",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Providers OAuth (Restent inchangés)
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

/** * @typedef {import('firebase/auth').Auth} FirebaseAuth */

/** @type {import('firebase/auth').Auth} */
let auth;

// ─── DÉTECTION DE L'ENVIRONNEMENT (Web vs Mobile) ───
if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {

  // CONFIGURATION POUR LE WEB
  auth = getAuth(app);

  // La persistance web de tes collègues reste ici
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Erreur setPersistence Web:", err);
  });

} else {

  // CONFIGURATION POUR LE MOBILE (React Native / Expo)
  // On utilise 'require' pour éviter que l'outil de build Web (Vite) ne plante en lisant des modules mobiles
  const { initializeAuth, getReactNativePersistence } = require("firebase/auth");
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// ─── EMULATEURS (S'appliquent aux deux environnements) ───
connectAuthEmulator(auth, FIREBASE_AUTH_URL, { disableWarnings: true });
connectFirestoreEmulator(db, FIREBASE_FIRESTORE_IP, FIREBASE_FIRESTORE_PORT);

export { auth, db };