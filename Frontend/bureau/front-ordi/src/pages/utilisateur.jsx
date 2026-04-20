import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "../../Style/Styles.css";

const Profile = ({ user, onLoginSuccess, onLogout }) => {
  const { t, i18n } = useTranslation();

  // profileData représente les données de la page affichée
  const [profileData, setProfileData] = useState({
    id: user?.id || "",
    pseudo: user?.pseudo || "Joueur",
    email: user?.email || "",
    bio: user?.bio || "",
    avatar:
      user?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=Lucky",
  });

  const [favorites, setFavorites] = useState([]);
  const [filter, setFilter] = useState("Tous");
  const [isFollowing, setIsFollowing] = useState(false);

  // Vérification : Est-ce mon propre compte ?
  // On compare l'ID de l'utilisateur connecté (user) à l'ID du profil affiché (profileData)
  const isOwnProfile = !profileData.id || user?.id === profileData.id;

  useEffect(() => {
    if (user) {
      // Si aucune donnée de profil externe n'est chargée, on affiche par défaut l'user connecté
      setProfileData((prev) => ({ ...prev, ...user }));

      const localKey = `library_${user.email}`;
      const savedLocal = JSON.parse(localStorage.getItem(localKey)) || [];
      setFavorites(savedLocal);

      fetchLibrary(user.id, user.email);
    }
  }, [user]);

  // --- LOGIQUE FOLLOW (Uniquement pour les autres) ---
  const handleFollow = async () => {
    if (!user?.id) {
      alert("Connectez-vous pour suivre des joueurs !");
      return;
    }
    if (isOwnProfile) return; // Sécurité supplémentaire

    try {
      await axios.post(`http://localhost:3000/api/user/follow`, {
        followerId: user.id,
        followingId: profileData.id,
      });
      setIsFollowing(true);
      alert(`Vous suivez désormais ${profileData.pseudo} !`);
    } catch (err) {
      alert("Erreur lors de l'action de suivi.");
    }
  };

  // --- LOGIQUE MESSAGE (Uniquement pour les autres) ---
  const handleSendMessage = () => {
    if (isOwnProfile) return;
    // Logique de redirection vers ta future page de chat
    alert(`Ouverture de la discussion avec ${profileData.pseudo}`);
  };

  const fetchLibrary = async (userId, userEmail) => {
    if (!userId || userId === "undefined") return;
    try {
      const res = await axios.get(
        `http://localhost:3000/api/user/favorites/${userId}`,
      );
      if (res.data) {
        setFavorites(res.data);
        localStorage.setItem(`library_${userEmail}`, JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn("Serveur injoignable, conservation des données locales.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "lang") {
      i18n.changeLanguage(value);
    } else {
      setProfileData({ ...profileData, [name]: value });
    }
  };

  const handleAvatarChange = (e) => {
    if (!isOwnProfile) return;
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
      await axios.put(`http://localhost:3000/api/user/update`, {
        userId: user.id,
        bio: profileData.bio,
        avatar: profileData.avatar,
      });
      if (onLoginSuccess) onLoginSuccess(profileData);
      alert(t("alertSuccess"));
    } catch (err) {
      alert("Erreur de sauvegarde (Serveur déconnecté)");
    }
  };

  const handleUpdateStatus = async (gameId, newStatus) => {
    if (!isOwnProfile) return; // On ne peut pas changer le statut des jeux d'un ami
    const updated = favorites.map((f) =>
      f.id === gameId ? { ...f, status: newStatus } : f,
    );
    setFavorites(updated);
    localStorage.setItem(`library_${user.email}`, JSON.stringify(updated));

    try {
      await axios.put(`http://localhost:3000/api/user/favorites/status`, {
        userId: user.id,
        gameId,
        status: newStatus,
      });
    } catch (err) {
      console.error("Impossible de synchroniser le statut.");
    }
  };

  return (
    <div className="user-page-container">
      <div className="profile-card-vertical">
        <h2 className="profile-main-title">
          {isOwnProfile ? t("profileTitle") : `Profil de ${profileData.pseudo}`}
        </h2>

        <div className="avatar-section-centered">
          <div className="avatar-wrapper-v2">
            <img
              src={profileData.avatar}
              alt="Avatar"
              className="avatar-img-v2"
            />
            {isOwnProfile && (
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
            )}
          </div>
          <p className="identified-text">{t("identifiedAs")}</p>
          <h3 className="pseudo-v2">{profileData.pseudo}</h3>

          {/* BOUTONS SOCIAUX : Affichés seulement si ce n'est PAS mon profil */}
          {!isOwnProfile && (
            <div
              className="profile-social-actions"
              style={{ display: "flex", gap: "10px", marginTop: "15px" }}
            >
              <button
                className={`btn-follow ${isFollowing ? "following" : ""}`}
                onClick={handleFollow}
              >
                {isFollowing ? "Abonné" : "Suivre"}
              </button>
              <button
                className="btn-save-v2"
                onClick={handleSendMessage}
                style={{ backgroundColor: "#4a90e2" }}
              >
                ✉️ Message
              </button>
            </div>
          )}
        </div>

        <div className="profile-form-v2">
          <label className="label-text-v2">{t("bioLabel")}</label>
          <textarea
            name="bio"
            className="input-field-v2 bio-area-v2"
            value={profileData.bio}
            onChange={handleChange}
            placeholder={t("placeholderBio")}
            disabled={!isOwnProfile}
          />

          {isOwnProfile && (
            <>
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
            </>
          )}
        </div>
      </div>

      <div className="library-section">
        <div className="library-header-compact">
          <h2>
            {isOwnProfile
              ? "Ma Bibliothèque"
              : `Bibliothèque de ${profileData.pseudo}`}{" "}
            ({favorites.length})
          </h2>
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
            <p>Aucun jeu dans la bibliothèque.</p>
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
                      disabled={!isOwnProfile}
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
