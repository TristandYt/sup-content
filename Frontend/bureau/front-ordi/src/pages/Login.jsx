// src/pages/Login.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../Service/firebase";
import "../../Style/Styles.css";

const Login = ({ onSwitch, onLoginSuccess }) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const FIREBASE_ERRORS = {
    "auth/user-not-found": "Aucun compte trouvé pour cet email.",
    "auth/wrong-password": "Mot de passe incorrect.",
    "auth/invalid-email": "Adresse email invalide.",
    "auth/invalid-credential": "Email ou mot de passe incorrect.",
    "auth/too-many-requests": "Trop de tentatives. Réessaie plus tard.",
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t("error_missing_info"));
      return;
    }

    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem("authToken", idToken);

      if (typeof onLoginSuccess === "function") {
        onLoginSuccess({
          pseudo: userCredential.user.displayName || email.split("@")[0],
          email: userCredential.user.email,
          uid: userCredential.user.uid,
        });
      }
    } catch (err) {
      setError(FIREBASE_ERRORS[err.code] || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="accueil-container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div className="hero-gradient"></div>

      <div
        className="game-card-modern"
        style={{
          width: "100%",
          maxWidth: "450px",
          padding: "2.5rem",
          cursor: "default",
        }}
      >
        {/* Sélecteur de langue */}
        <div
          className="categories-nav"
          style={{ justifyContent: "flex-end", marginBottom: "1rem" }}
        >
          <button
            className={`category-btn ${i18n.language === "Français" ? "active" : ""}`}
            onClick={() => i18n.changeLanguage("Français")}
          >
            FR
          </button>
          <button
            className={`category-btn ${i18n.language === "English" ? "active" : ""}`}
            onClick={() => i18n.changeLanguage("English")}
          >
            EN
          </button>
        </div>

        {/* Titre */}
        <div
          className="hero-content"
          style={{ padding: 0, textAlign: "center" }}
        >
          <h2 className="hero-title" style={{ fontSize: "2rem" }}>
            {t("title")}
          </h2>
          <p className="hero-subtitle" style={{ marginBottom: "1.5rem" }}>
            Accédez à votre bibliothèque
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div
            className="section-count"
            style={{
              display: "block",
              textAlign: "center",
              marginBottom: "1rem",
              background: "rgba(239, 68, 68, 0.2)",
              color: "#f87171",
            }}
          >
            {error}
          </div>
        )}

        {/* Champs du formulaire */}
        <div className="filters-section">
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              className="game-genre"
              style={{ display: "inline-block", marginBottom: "0.5rem" }}
            >
              {t("label_email")}
            </label>
            <input
              className="filter-select"
              style={{ width: "100%", minWidth: "auto" }}
              placeholder="Ex: kiki@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <label
              className="game-genre"
              style={{ display: "inline-block", marginBottom: "0.5rem" }}
            >
              {t("label_password")}
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="filter-select"
                style={{ width: "100%", minWidth: "auto" }}
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: "15px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                }}
              >
                {showPass ? "🔓" : "🔒"}
              </button>
            </div>
          </div>
        </div>

        {/* Bouton connexion */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="category-btn active"
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1rem",
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Connexion..." : t("button_submit")}
        </button>

        {/* Séparateur */}
        <div
          style={{ display: "flex", alignItems: "center", margin: "1.5rem 0" }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "rgba(255,255,255,0.1)",
            }}
          ></div>
          <span
            style={{ margin: "0 10px", color: "#64748b", fontSize: "0.8rem" }}
          >
            OU
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "rgba(255,255,255,0.1)",
            }}
          ></div>
        </div>

        {/* Connexion sociale */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button
            className="game-card-modern"
            style={{
              padding: "0.75rem",
              display: "flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              width="20"
              alt="Google"
            />
          </button>
          <button
            className="game-card-modern"
            style={{
              padding: "0.75rem",
              display: "flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <img
              src="https://www.svgrepo.com/show/512317/github-142.svg"
              width="20"
              alt="GitHub"
              style={{ filter: "invert(1)" }}
            />
          </button>
        </div>

        {/* Lien vers Register */}
        <p
          className="hero-subtitle"
          style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.9rem" }}
        >
          {t("footer_text")}{" "}
          <span
            onClick={onSwitch}
            className="game-title"
            style={{
              fontSize: "0.9rem",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {t("footer_link")}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
