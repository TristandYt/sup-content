import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../Service/firebase";
import { useOAuth } from "../hooks/useOAuth";
import "../../Style/Styles.css";

const Login = ({ onSwitch, onLoginSuccess }) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOAuthLoading] = useState(null); // "google" | "github" | null

  const { loginWithGoogle, loginWithGithub } = useOAuth();

  const FIREBASE_ERRORS = {
    "auth/user-not-found": "Aucun compte trouvé pour cet email.",
    "auth/wrong-password": "Mot de passe incorrect.",
    "auth/invalid-email": "Adresse email invalide.",
    "auth/invalid-credential": "Email ou mot de passe incorrect.",
    "auth/too-many-requests": "Trop de tentatives. Réessaie plus tard.",
  };

  useEffect(() => {
    document.title = "Connexion | TGMF";
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t("error_missing_info"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (typeof onLoginSuccess === "function") {
        onLoginSuccess();
      }
    } catch (err) {
      setError(FIREBASE_ERRORS[err.code] || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  // Route personnalisée pour réinitialiser le mot de passe via l'API locale (alternative au mail direct Firebase)
  const handleResetPassword = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir l'email et le nouveau mot de passe.");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:3000/api/users/reset-password-public",
        {
          email,
          newPassword: password,
        },
      );
      setMessage(res.data.msg);
      setIsResetMode(false);
    } catch (err) {
      setError(
        err.response?.data?.msg || "Erreur lors de la réinitialisation.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthGoogle = async () => {
    setError("");
    setOAuthLoading("google");
    try {
      const response = await loginWithGoogle();
      if (response.success) {
        if (typeof onLoginSuccess === "function") {
          onLoginSuccess();
        }
      }
    } catch (err) {
      setError(err.message || "Erreur connexion Google");
    } finally {
      setOAuthLoading(null);
    }
  };

  const handleOAuthGithub = async () => {
    setError("");
    setOAuthLoading("github");
    try {
      const response = await loginWithGithub();
      if (response.success) {
        if (typeof onLoginSuccess === "function") {
          onLoginSuccess();
        }
      }
    } catch (err) {
      setError(err.message || "Erreur connexion GitHub");
    } finally {
      setOAuthLoading(null);
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
            className={`category-btn ${i18n.language === "fr" ? "active" : ""}`}
            onClick={() => i18n.changeLanguage("fr")}
          >
            FR
          </button>
          <button
            className={`category-btn ${i18n.language === "en" ? "active" : ""}`}
            onClick={() => i18n.changeLanguage("en")}
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
            {isResetMode ? t("reset_title") : t("title")}
          </h2>
          <p className="hero-subtitle" style={{ marginBottom: "1.5rem" }}>
            {t("subtitle")}
          </p>
        </div>

        {/* Messages */}
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
        {message && (
          <div
            className="section-count"
            style={{
              display: "block",
              textAlign: "center",
              marginBottom: "1rem",
              background: "rgba(34, 197, 94, 0.2)",
              color: "#4ade80",
            }}
          >
            {message}
          </div>
        )}

        {/* Champs */}
        <div className="filters-section">
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              className="game-genre"
              style={{ display: "inline-block", marginBottom: "0.5rem" }}
            >
              {isResetMode ? t("reset_email_label") : t("label_email")}
            </label>
            <input
              className="filter-select"
              style={{ width: "100%", minWidth: "auto" }}
              placeholder="Ex: exemple@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                (isResetMode ? handleResetPassword() : handleLogin())
              }
            />
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <label
                className="game-genre"
                style={{ display: "inline-block", marginBottom: "0.5rem" }}
              >
                {isResetMode ? t("reset_password_label") : t("label_password")}
              </label>
              {!isResetMode && (
                <span
                  onClick={() => setIsResetMode(true)}
                  style={{
                    fontSize: "0.75rem",
                    color: "#c084fc",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {t("forgot_password")}
                </span>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <input
                className="filter-select"
                style={{ width: "100%", minWidth: "auto" }}
                type={showPass ? "text" : "password"}
                placeholder={isResetMode ? "Nouveau mot de passe" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (isResetMode ? handleResetPassword() : handleLogin())
                }
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

        {/* Boutons principaux */}
        {isResetMode ? (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="category-btn active"
              style={{ flex: 2, padding: "1rem" }}
            >
              {loading ? "..." : t("reset_button")}
            </button>
            <button
              onClick={() => {
                setIsResetMode(false);
                setError("");
              }}
              className="category-btn"
              style={{ flex: 1, padding: "1rem" }}
            >
              {t("cancel_button")}
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            disabled={loading || oauthLoading !== null}
            className="category-btn active"
            style={{ width: "100%", padding: "1rem" }}
          >
            {loading ? "Connexion..." : t("button_submit")}
          </button>
        )}

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

        {/* Boutons OAuth */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button
            onClick={handleOAuthGoogle}
            disabled={oauthLoading !== null || loading}
            className="game-card-modern"
            style={{
              padding: "0.75rem",
              display: "flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.05)",
              opacity: oauthLoading ? 0.6 : 1,
              cursor: oauthLoading ? "not-allowed" : "pointer",
            }}
          >
            {oauthLoading === "google" ? (
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>...</span>
            ) : (
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                width="20"
                alt="Google"
              />
            )}
          </button>
          <button
            onClick={handleOAuthGithub}
            disabled={oauthLoading !== null || loading}
            className="game-card-modern"
            style={{
              padding: "0.75rem",
              display: "flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.05)",
              opacity: oauthLoading ? 0.6 : 1,
              cursor: oauthLoading ? "not-allowed" : "pointer",
            }}
          >
            {oauthLoading === "github" ? (
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>...</span>
            ) : (
              <img
                src="https://www.svgrepo.com/show/512317/github-142.svg"
                width="20"
                alt="GitHub"
                style={{ filter: "invert(1)" }}
              />
            )}
          </button>
        </div>

        {/* Lien Register */}
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
