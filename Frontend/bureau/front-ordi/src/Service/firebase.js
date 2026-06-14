import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  browserLocalPersistence,
  setPersistence,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "fake-api-key",
  authDomain: "localhost",
  projectId: "sup-content-tristan",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Maintien de la session dans le localStorage pour qu'elle survive au rafraîchissement de la page
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Erreur setPersistence:", err);
});

connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });

// Configuration des fournisseurs d'authentification tiers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export { auth };
