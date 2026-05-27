import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "fake-api-key",
  authDomain: "localhost",
  projectId: "sup-content-tristan",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Persistence explicite en localStorage → survit au refresh
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Erreur setPersistence:", err);
});

connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });

export { auth };
