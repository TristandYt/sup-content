import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "../../Style/Styles.css";

// IMPORT FIREBASE (Assure-toi que ce fichier existe dans ton dossier src/firebase/config.js)
import { auth, db } from "../firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

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

  const changeLanguage = (lng) => i18n.changeLanguage(lng);
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateForm = () => {
    const { pseudo, email, pass, confirm } = formData;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!pseudo || !email || !pass || !confirm) return t("error_fields_empty");
    if (!emailRegex.test(email)) return t("placeholder_email");
    if (pass.length < 8) return "8 characters min.";
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
      // 1. Création de l'utilisateur dans l'Authentication Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.pass,
      );
      const user = userCredential.user;

      // 2. Création du profil dans Firestore selon ton schéma d'image
      await setDoc(doc(db, "users", user.uid), {
        uid_firebase: user.uid,
        email: formData.email,
        pseudo: formData.pseudo,
        avatar: "", // Valeur par défaut vide
        role: "user", // Rôle par défaut
        favorites: [], // Tableau vide selon ton schéma
        following: [], // Tableau vide selon ton schéma
        followers: [], // Tableau vide selon ton schéma
        blockedUsers: [], // Tableau vide selon ton schéma
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      alert("Compte créé avec succès !");
      if (onSwitch) onSwitch(); // Retour au login après succès
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("Cet email est déjà utilisé.");
      } else {
        setError("Une erreur est survenue lors de l'inscription.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Icône Oeil pour le mot de passe
  const EyeIcon = ({ open }) =>
    open ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    );

  return (
    <div className="container">
      <div className="card" style={{ position: "relative" }}>
        {/* SÉLECTEUR DE LANGUE */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            display: "flex",
            gap: "8px",
            zIndex: 10,
          }}
        >
          <button
            onClick={() => changeLanguage("fr")}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <img
              src="https://flagcdn.com/w40/fr.png"
              width="22"
              alt="FR"
              style={{
                opacity: i18n.language === "fr" ? 1 : 0.3,
                borderRadius: "2px",
              }}
            />
          </button>
          <button
            onClick={() => changeLanguage("en")}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <img
              src="https://flagcdn.com/w40/gb.png"
              width="22"
              alt="EN"
              style={{
                opacity: i18n.language === "en" ? 1 : 0.3,
                borderRadius: "2px",
              }}
            />
          </button>
        </div>

        <h2 className="title">{t("signup_title")}</h2>

        <div
          className="error-msg"
          style={{
            minHeight: "20px",
            color: "#ff4d4d",
            fontSize: "0.9rem",
            marginBottom: "10px",
          }}
        >
          {error}
        </div>

        <div className="form-group">
          <label className="label-text">{t("label_pseudo")}</label>
          <input
            name="pseudo"
            className="input-field"
            placeholder={t("placeholder_pseudo")}
            onChange={handleChange}
            disabled={isLoading}
          />

          <label className="label-text">{t("label_email")}</label>
          <input
            name="email"
            type="email"
            className="input-field"
            placeholder={t("placeholder_email")}
            onChange={handleChange}
            disabled={isLoading}
          />

          <label className="label-text">{t("label_password")}</label>
          <div className="password-container">
            <input
              name="pass"
              type={showPass ? "text" : "password"}
              className="input-field"
              placeholder="••••••••"
              onChange={handleChange}
              disabled={isLoading}
            />
            <button
              onClick={() => setShowPass(!showPass)}
              className="eye-button"
              type="button"
            >
              <EyeIcon open={showPass} />
            </button>
          </div>

          <label className="label-text">{t("label_confirm_password")}</label>
          <div className="password-container">
            <input
              name="confirm"
              type={showConfirm ? "text" : "password"}
              className="input-field"
              placeholder="••••••••"
              onChange={handleChange}
              disabled={isLoading}
            />
            <button
              onClick={() => setShowConfirm(!showConfirm)}
              className="eye-button"
              type="button"
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
        </div>

        <button
          onClick={handleRegister}
          className={`btn-main ${isLoading ? "btn-disabled" : ""}`}
          disabled={isLoading}
        >
          {isLoading ? "..." : t("button_signup")}
        </button>

        <div className="divider">
          <div className="divider-line"></div>
          <span className="divider-text">{t("divider_signup")}</span>
          <div className="divider-line"></div>
        </div>

        <p className="footer-text">
          {i18n.language === "fr" ? "Déjà inscrit ?" : "Already registered?"}
          <span
            onClick={!isLoading ? onSwitch : null}
            className="link-highlight"
            style={{ cursor: "pointer", marginLeft: "5px" }}
          >
            {i18n.language === "fr" ? "Se connecter" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
