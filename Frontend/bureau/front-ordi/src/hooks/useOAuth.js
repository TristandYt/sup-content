import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, githubProvider } from "../Service/firebase";

const BACKEND_URL = "http://localhost:3000";

export function useOAuth() {
  const callBackendOAuth = async (idToken) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/oauth/callback`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.msg || "Erreur OAuth backend");
    }

    return res.json();
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const backendResponse = await callBackendOAuth(idToken);
      localStorage.setItem("authToken", idToken);
      return backendResponse;
    } catch (error) {
      throw new Error(error.message || "Erreur connexion Google");
    }
  };

  const loginWithGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const idToken = await result.user.getIdToken();
      const backendResponse = await callBackendOAuth(idToken);
      localStorage.setItem("authToken", idToken);
      return backendResponse;
    } catch (error) {
      throw new Error(error.message || "Erreur connexion GitHub");
    }
  };

  return { loginWithGoogle, loginWithGithub };
}
