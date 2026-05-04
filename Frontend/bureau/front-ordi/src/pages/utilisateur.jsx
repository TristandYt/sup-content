import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { auth } from "../Service/firebase";
import "../../Style/Styles.css";

const authAxios = async () => {
  const token = await auth.currentUser?.getIdToken(true);
  return axios.create({
    baseURL: "http://localhost:3000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

const Profile = ({ user, onLoginSuccess, onLogout }) => {
  const { t, i18n } = useTranslation();

  const [profileData, setProfileData] = useState({
    pseudo: user?.pseudo || user?.displayName || "Joueur",
    email: user?.email || "",
    bio: user?.bio || "",
    avatar:
      user?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=Lucky",
  });

  const [favorites, setFavorites] = useState([]);
  const [filter, setFilter] = useState("Tous");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        pseudo: user.pseudo || user.displayName || prev.pseudo,
        email: user.email || prev.email,
        bio: user.bio || prev.bio,
      }));
      fetchLibrary();
    }
  }, [user]);

  // ─── FETCH FAVORIS ────────────────────────────────────────────────────────
  // Retourne : { favorites: [{gameId, gameName, gameCover}] }
  const fetchLibrary = async () => {
    try {
      const api = await authAxios();
      const res = await api.get(`/users/favorites`);
      const favs = res.data?.favorites || [];
      setFavorites(favs);
    } catch (err) {
      console.warn("Bibliothèque : erreur.", err.message);
    }
  };

  // ─── MISE À JOUR PROFIL ───────────────────────────────────────────────────
  // Body attendu : { username?, bio? }
  const handleUpdate = async () => {
    setSaveStatus("saving");
    try {
      const api = await authAxios();
      await api.put("/users/profile", {
        username: profileData.pseudo,
        bio: profileData.bio,
      });
      if (onLoginSuccess) onLoginSuccess(profileData);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      console.error("Erreur update profil", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "lang") i18n.changeLanguage(value);
    else setProfileData({ ...profileData, [name]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) =>
        setProfileData({ ...profileData, avatar: event.target.result });
      reader.readAsDataURL(file);
    }
  };

  const saveLabel = {
    saving: "Sauvegarde...",
    saved: "✅ Sauvegardé !",
    error: "❌ Erreur",
    "": t("btnUpdate"),
  }[saveStatus];

  return (
    <div className="app-container">
      <div className="hero-gradient"></div>

      <div className="main-content-wrapper profile-layout">
        {/* SECTION GAUCHE */}
        <div className="profile-sidebar">
          <div
            className="game-card-modern profile-main-card"
            style={{ cursor: "default", padding: "30px" }}
          >
            <div className="avatar-section-centered">
              <div className="avatar-wrapper-v2">
                <img
                  src={profileData.avatar}
                  alt="Avatar"
                  className="avatar-img-v2"
                />
                <label htmlFor="avatar-input" className="edit-badge-v2">
                  ✏️
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              <h3
                className="hero-title"
                style={{ fontSize: "1.8rem", marginTop: "15px" }}
              >
                {profileData.pseudo}
              </h3>
              <p className="game-year">{t("identifiedAs")}</p>
            </div>

            <div className="profile-form-modern" style={{ marginTop: "25px" }}>
              <label
                className="game-genre"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Bio
              </label>
              <textarea
                name="bio"
                className="filter-select"
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "12px",
                  background: "rgba(0,0,0,0.2)",
                }}
                value={profileData.bio}
                onChange={handleChange}
                placeholder={t("placeholderBio")}
              />

              <label
                className="game-genre"
                style={{ display: "block", margin: "20px 0 8px 0" }}
              >
                {t("langLabel")}
              </label>
              <select
                name="lang"
                className="filter-select"
                style={{ width: "100%" }}
                value={i18n.language}
                onChange={handleChange}
              >
                <option value="fr">Français 🇫🇷</option>
                <option value="en">English 🇬🇧</option>
              </select>

              <div
                style={{
                  marginTop: "30px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <button
                  className="nav-user-btn"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    opacity: saveStatus === "saving" ? 0.7 : 1,
                  }}
                  onClick={handleUpdate}
                  disabled={saveStatus === "saving"}
                >
                  {saveLabel}
                </button>
                <button
                  className="category-btn"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    borderColor: "#ef4444",
                    color: "#ef4444",
                  }}
                  onClick={onLogout}
                >
                  {t("btnLogout")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION DROITE : BIBLIOTHÈQUE */}
        <div className="profile-content">
          <div className="section-header" style={{ marginBottom: "20px" }}>
            <h2 className="section-title">Ma Collection</h2>
            <span className="section-count">{favorites.length}</span>
          </div>

          <div className="filters-container" style={{ marginBottom: "30px" }}>
            {["Tous", "A faire", "En cours", "Fini"].map((s) => (
              <button
                key={s}
                className={`category-btn ${filter === s ? "active" : ""}`}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {favorites.length === 0 ? (
            <div
              className="game-card-modern"
              style={{
                padding: "40px",
                textAlign: "center",
                cursor: "default",
              }}
            >
              <p className="hero-subtitle">La bibliothèque est vide...</p>
            </div>
          ) : (
            <div className="game-grid">
              {/* Le backend stocke {gameId, gameName, gameCover} — pas de status */}
              {favorites.map((game) => (
                <div key={game.gameId} className="game-card-modern">
                  <div className="game-image-container">
                    <img
                      src={game.gameCover}
                      alt={game.gameName}
                      className="game-image"
                    />
                  </div>
                  <div className="game-content">
                    <h4
                      className="game-title"
                      style={{ fontSize: "1rem", marginBottom: "10px" }}
                    >
                      {game.gameName}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
