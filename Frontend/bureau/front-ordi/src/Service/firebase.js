import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: "fake-api-key",
  authDomain: "localhost",
  projectId: "sup-content-tristan",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });

export { auth };
