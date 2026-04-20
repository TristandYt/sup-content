import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "../../Style/Styles.css";

const Profile = ({ user, onLoginSuccess, onLogout }) => {
  const { t, i18n } = useTranslation();

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

  const isOwnProfile = !profileData.id || user?.id === profileData.id;

  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({ ...prev, ...user }));
      const localKey = `library_${user.email}`;
      const savedLocal = JSON.parse(localStorage.getItem(localKey)) || [];
      setFavorites(savedLocal);
      fetchLibrary(user.id, user.email);
    }
  }, [user]);

  const handleFollow = async () => {
    if (!user?.id) {
      alert("Connectez-vous !");
      return;
    }
    try {
      await axios.post(`http://localhost:3000/api/user/follow`, {
        followerId: user.id,
        followingId: profileData.id,
      });
      setIsFollowing(true);
    } catch (err) {
      alert("Erreur de suivi.");
    }
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
      console.warn("Mode local activé.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "lang") i18n.changeLanguage(value);
    else setProfileData({ ...profileData, [name]: value });
  };

  const handleAvatarChange = (e) => {
    if (!isOwnProfile) return;
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) =>
        setProfileData({ ...profileData, avatar: event.target.result });
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
      alert("Erreur serveur.");
    }
  };

  const handleUpdateStatus = async (gameId, newStatus) => {
    if (!isOwnProfile) return;
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
      console.error("Sync error");
    }
  };

  return (
    <div className="app-container">
      <div className="hero-gradient"></div>

      <div className="main-content-wrapper profile-layout">
        {/* SECTION GAUCHE : CARTE PROFIL */}
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
                {isOwnProfile && (
                  <label htmlFor="avatar-input" className="edit-badge-v2">
                    ✏️{" "}
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
              <h3
                className="hero-title"
                style={{ fontSize: "1.8rem", marginTop: "15px" }}
              >
                {profileData.pseudo}
              </h3>
              <p className="game-year">
                {isOwnProfile ? t("identifiedAs") : "Joueur vérifié"}
              </p>
            </div>

            {!isOwnProfile && (
              <div
                className="profile-social-actions"
                style={{ display: "flex", gap: "10px", marginTop: "20px" }}
              >
                <button
                  className={`nav-user-btn ${isFollowing ? "" : "category-btn"}`}
                  onClick={handleFollow}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {isFollowing ? "Abonné" : "Suivre"}
                </button>
                <button
                  className="nav-user-btn"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    flex: 1,
                    justifyContent: "center",
                  }}
                >
                  ✉️ Message
                </button>
              </div>
            )}

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
                disabled={!isOwnProfile}
              />

              {isOwnProfile && (
                <>
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
                    className="profile-actions-buttons"
                    style={{
                      marginTop: "30px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <button
                      className="nav-user-btn"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={handleUpdate}
                    >
                      {t("btnUpdate")}
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* SECTION DROITE : BIBLIOTHÈQUE */}
        <div className="profile-content">
          <div className="section-header" style={{ marginBottom: "20px" }}>
            <h2 className="section-title">
              {isOwnProfile ? "Ma Collection" : `Jeux de ${profileData.pseudo}`}
            </h2>
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
              {favorites
                .filter((g) => filter === "Tous" || g.status === filter)
                .map((game) => (
                  <div key={game.id} className="game-card-modern">
                    <div className="game-image-container">
                      <img
                        src={game.image_url}
                        alt={game.name}
                        className="game-image"
                      />
                      <div
                        className="rating-badge"
                        style={{ top: "10px", right: "10px" }}
                      >
                        <span
                          className="rating-value"
                          style={{ fontSize: "0.7rem" }}
                        >
                          {game.status || "A faire"}
                        </span>
                      </div>
                    </div>
                    <div className="game-content">
                      <h4
                        className="game-title"
                        style={{ fontSize: "1rem", marginBottom: "10px" }}
                      >
                        {game.name}
                      </h4>
                      {isOwnProfile && (
                        <select
                          className="filter-select"
                          style={{
                            width: "100%",
                            fontSize: "0.8rem",
                            padding: "5px",
                          }}
                          value={game.status || "A faire"}
                          onChange={(e) =>
                            handleUpdateStatus(game.id, e.target.value)
                          }
                        >
                          <option value="A faire">À faire</option>
                          <option value="En cours">En cours</option>
                          <option value="Fini">Fini</option>
                        </select>
                      )}
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
