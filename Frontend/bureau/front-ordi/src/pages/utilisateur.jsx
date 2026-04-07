import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "../../Style/Styles.css";

const Profile = ({ user, onLoginSuccess, onLogout }) => {
  const { t, i18n } = useTranslation();

  // --- ÉTAT DU PROFIL ---
  const [profileData, setProfileData] = useState({
    pseudo: user?.pseudo || "kiki",
    email: user?.email || "kiki@kiki.com",
    bio: user?.bio || "",
    avatar:
      user?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=Lucky",
  });

  // --- ÉTAT DE LA BIBLIOTHÈQUE ---
  const [favorites, setFavorites] = useState([]);
  const [filter, setFilter] = useState("Tous");

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({ ...prev, ...user }));
      fetchLibrary();
    }
  }, [user]);

  const fetchLibrary = async () => {
    if (user?.id) {
      try {
        // 1. On tente de récupérer la bibliothèque depuis la BDD
        const res = await axios.get(
          `http://localhost:3000/api/user/favorites/${user.id}`,
        );
        setFavorites(res.data);
        // 2. On synchronise le local pour le composant Jeu.jsx
        localStorage.setItem(`library_${user.email}`, JSON.stringify(res.data));
      } catch (err) {
        console.error("Erreur BDD, chargement du secours local...");
        const local =
          JSON.parse(localStorage.getItem(`library_${user.email}`)) || [];
        setFavorites(local);
      }
    }
  };

  // --- GESTION DES CHANGEMENTS PROFIL ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "lang") {
      i18n.changeLanguage(value);
    } else {
      setProfileData({ ...profileData, [name]: value });
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileData({ ...profileData, avatar: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    try {
      // Sauvegarde en BDD
      await axios.put(`http://localhost:3000/api/user/update`, {
        userId: user.id,
        bio: profileData.bio,
        avatar: profileData.avatar,
      });

      if (onLoginSuccess) onLoginSuccess(profileData);
      alert(t("alertSuccess"));
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  // --- GESTION STATUT JEUX ---
  const handleUpdateStatus = async (gameId, newStatus) => {
    try {
      await axios.put(`http://localhost:3000/api/user/favorites/status`, {
        userId: user.id,
        gameId,
        status: newStatus,
      });
      const updated = favorites.map((f) =>
        f.id === gameId ? { ...f, status: newStatus } : f,
      );
      setFavorites(updated);
      localStorage.setItem(`library_${user.email}`, JSON.stringify(updated));
    } catch (err) {
      console.error("Erreur mise à jour statut");
    }
  };

  return (
    <div className="user-page-container">
      {/* SECTION PROFIL */}
      <div className="profile-card-vertical">
        <h2 className="profile-main-title">{t("profileTitle")}</h2>

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
          <p className="identified-text">{t("identifiedAs")}</p>
          <h3 className="pseudo-v2">{profileData.pseudo}</h3>
        </div>

        <div className="profile-form-v2">
          <label className="label-text-v2">{t("bioLabel")}</label>
          <textarea
            name="bio"
            className="input-field-v2 bio-area-v2"
            value={profileData.bio}
            onChange={handleChange}
            placeholder={t("placeholderBio")}
          />

          <label className="label-text-v2">{t("langLabel")}</label>
          <select
            name="lang"
            className="input-field-v2 select-field-v2"
            value={i18n.language}
            onChange={handleChange}
          >
            <option value="fr">Français 🇫🇷</option>
            <option value="en">English 🇬🇧</option>
          </select>

          <label className="label-text-v2">{t("emailLabel")}</label>
          <input
            className="input-field-v2 input-disabled-v2"
            value={profileData.email}
            disabled
          />

          <div className="profile-actions-v2">
            <button className="btn-save-v2" onClick={handleUpdate}>
              {t("btnUpdate")}
            </button>
            <button className="btn-logout-v2" onClick={onLogout}>
              {t("btnLogout")}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION BIBLIOTHÈQUE (BILBOTHEQUE) */}
      <div className="library-section">
        <div className="library-header-compact">
          <h2>Ma Bibliothèque ({favorites.length})</h2>
          <div className="filter-pill-box">
            {["Tous", "A faire", "En cours", "Fini"].map((s) => (
              <button
                key={s}
                className={`pill ${filter === s ? "active" : ""}`}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="empty-library">
            <p>Votre bibliothèque est vide.</p>
          </div>
        ) : (
          <div className="library-grid">
            {favorites
              .filter((g) => filter === "Tous" || g.status === filter)
              .map((game) => (
                <div key={game.id} className="library-item">
                  <img
                    src={game.image_url}
                    alt={game.name}
                    className="library-cover"
                  />
                  <div className="library-info">
                    <h4>{game.name}</h4>
                    <select
                      className="status-select"
                      value={game.status || "A faire"}
                      onChange={(e) =>
                        handleUpdateStatus(game.id, e.target.value)
                      }
                    >
                      <option value="A faire">À faire</option>
                      <option value="En cours">En cours</option>
                      <option value="Fini">Fini</option>
                    </select>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
