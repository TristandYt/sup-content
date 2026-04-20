import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "../../Style/Styles.css";

const Login = ({ onSwitch, onLoginSuccess }) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("kiki@kiki.com");
  const [password, setPassword] = useState("kikiki");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError(t("error_missing_info"));
    } else {
      setError("");
      if (typeof onLoginSuccess === "function") {
        onLoginSuccess({
          pseudo: email.includes("@") ? email.split("@")[0] : email,
          email: email,
        });
      }
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

      {/* On utilise la structure game-card-modern pour le formulaire */}
      <div
        className="game-card-modern"
        style={{
          width: "100%",
          maxWidth: "450px",
          padding: "2.5rem",
          cursor: "default",
        }}
      >
        {/* Langues utilisant le style des boutons de catégorie */}
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

        <button
          onClick={handleLogin}
          className="category-btn active"
          style={{ width: "100%", padding: "1rem", fontSize: "1rem" }}
        >
          {t("button_submit")}
        </button>

        <div
          className="divider"
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
              alt="G"
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
              alt="GH"
              style={{ filter: "invert(1)" }}
            />
          </button>
        </div>

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
