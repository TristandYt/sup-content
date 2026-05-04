// src/pages/Register.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../Service/firebase";
import "../../Style/Styles.css";

const Register = ({ onSwitch }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    pseudo: "",
    email: "",
    pass: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const FIREBASE_ERRORS = {
    "auth/email-already-in-use": "Un compte existe déjà avec cet email.",
    "auth/invalid-email": "Adresse email invalide.",
    "auth/weak-password": "Mot de passe trop faible (8 caractères min.).",
    "auth/too-many-requests": "Trop de tentatives. Réessaie plus tard.",
  };

  const validateForm = () => {
    const { pseudo, email, pass, confirm } = formData;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!pseudo || !email || !pass || !confirm) return t("error_fields_empty");
    if (!emailRegex.test(email)) return t("placeholder_email");
    if (pass.length < 8) return "8 caractères minimum.";
    if (pass !== confirm) return t("error_password_match");
    return null;
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // 1. Créer le compte Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.pass,
      );

      // 2. Mettre à jour le pseudo dans le profil Firebase
      await updateProfile(userCredential.user, {
        displayName: formData.pseudo,
      });

      // 3. Stocker le token
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem("authToken", idToken);

      // 4. Rediriger vers le login
      onSwitch();
    } catch (err) {
      setError(
        FIREBASE_ERRORS[err.code] || "Erreur lors de la création du compte.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="app-container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      <div className="hero-gradient"></div>

      <div
        className="game-card-modern"
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "2.5rem",
          cursor: "default",
        }}
      >
        {/* Sélecteur de langue */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginBottom: "1rem",
          }}
        >
          <button
            className={`category-btn ${i18n.language === "fr" ? "active" : ""}`}
            style={{ padding: "4px 12px" }}
            onClick={() => i18n.changeLanguage("fr")}
          >
            FR
          </button>
          <button
            className={`category-btn ${i18n.language === "en" ? "active" : ""}`}
            style={{ padding: "4px 12px" }}
            onClick={() => i18n.changeLanguage("en")}
          >
            EN
          </button>
        </div>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2
            className="hero-title"
            style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}
          >
            {t("signup_title")}
          </h2>
          <p className="hero-subtitle">Créez votre profil de joueur</p>
        </div>

        {error && (
          <div
            className="section-count"
            style={{
              display: "block",
              textAlign: "center",
              marginBottom: "1.5rem",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              width: "100%",
            }}
          >
            {error}
          </div>
        )}

        <div className="filters-section">
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              className="game-genre"
              style={{ display: "inline-block", marginBottom: "0.5rem" }}
            >
              {t("label_pseudo")}
            </label>
            <input
              name="pseudo"
              className="filter-select"
              style={{ width: "100%" }}
              placeholder={t("placeholder_pseudo")}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label
              className="game-genre"
              style={{ display: "inline-block", marginBottom: "0.5rem" }}
            >
              {t("label_email")}
            </label>
            <input
              name="email"
              type="email"
              className="filter-select"
              style={{ width: "100%" }}
              placeholder={t("placeholder_email")}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label
              className="game-genre"
              style={{ display: "inline-block", marginBottom: "0.5rem" }}
            >
              {t("label_password")}
            </label>
            <div style={{ position: "relative" }}>
              <input
                name="pass"
                type={showPass ? "text" : "password"}
                className="filter-select"
                style={{ width: "100%" }}
                placeholder="••••••••"
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  opacity: 0.6,
                }}
                type="button"
              >
                {showPass ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <label
              className="game-genre"
              style={{ display: "inline-block", marginBottom: "0.5rem" }}
            >
              {t("label_confirm_password")}
            </label>
            <div style={{ position: "relative" }}>
              <input
                name="confirm"
                type={showConfirm ? "text" : "password"}
                className="filter-select"
                style={{ width: "100%" }}
                placeholder="••••••••"
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  opacity: 0.6,
                }}
                type="button"
              >
                {showConfirm ? "👁️" : "🙈"}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleRegister}
          className="category-btn active"
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1rem",
            marginBottom: "1.5rem",
          }}
          disabled={isLoading}
        >
          {isLoading ? t("loading") : t("button_signup")}
        </button>

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
            style={{ padding: "0 15px", color: "#64748b", fontSize: "0.85rem" }}
          >
            OU CONTINUER AVEC
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "rgba(255,255,255,0.1)",
            }}
          ></div>
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button
            className="nav-icon-btn"
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              width: "50px",
              height: "50px",
            }}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              width="24"
              alt="Google"
            />
          </button>
          <button
            className="nav-icon-btn"
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              width: "50px",
              height: "50px",
            }}
          >
            <img
              src="https://www.svgrepo.com/show/512317/github-142.svg"
              width="24"
              alt="GitHub"
              style={{ filter: "invert(1)" }}
            />
          </button>
        </div>

        <p
          className="hero-subtitle"
          style={{
            textAlign: "center",
            marginTop: "2rem",
            fontSize: "0.95rem",
          }}
        >
          {t("already_registered")}{" "}
          <span
            onClick={!isLoading ? onSwitch : null}
            className="game-title"
            style={{
              fontSize: "0.95rem",
              cursor: "pointer",
              textDecoration: "underline",
              color: "#c084fc",
            }}
          >
            {t("login_link")}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
