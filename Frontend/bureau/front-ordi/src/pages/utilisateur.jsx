import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { auth } from "../Service/firebase";
import "../../Style/Styles.css";
import defaultCover from "../assets/fr-default-large_default.jpg";

const authAxios = async () => {
  const token = await auth.currentUser?.getIdToken(true);
  return axios.create({
    baseURL: "http://localhost:3000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

/* ═══════════════════════════════════════════════════════════
   VUE PROFIL PUBLIC — isPublic === true
═══════════════════════════════════════════════════════════ */
const PublicProfile = ({
  targetUserId,
  currentUser,
  onBack,
  onOpenMessaging,
  onGameClick,
}) => {
  const [profile, setProfile] = useState(null);
  const [iFollow, setIFollow] = useState(false);
  const [theyFollowMe, setTheyFollowMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [error, setError] = useState("");
  const [library, setLibrary] = useState([]);

  const myId = String(currentUser?.uid || currentUser?.id || "");
  const isMe = myId !== "" && myId === String(targetUserId);

  useEffect(() => {
    fetchAll();
  }, [targetUserId]);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const api = await authAxios();

      const [profileRes, followingRes, followersRes, libraryRes] =
        await Promise.all([
          api.get(`/users/${targetUserId}/profile`),
          api.get("/follows/me/following"),
          api.get("/follows/me/followers"),
          api
            .get(`/lists/library?userId=${targetUserId}`)
            .catch(() => ({ data: { library: [] } })),
        ]);

      const data = profileRes.data;
      const userData = data?.user || data;
      const lib = libraryRes.data?.library || [];

      setProfile({
        username: userData.username || userData.pseudo || "Utilisateur",
        bio: userData.bio || "",
        avatar: userData.avatar || userData.photoURL || null,
        followersCount: userData.followersCount ?? "—",
        followingCount: userData.followingCount ?? "—",
        gamesCount: lib.length,
      });

      setLibrary(lib);

      // ✅ CORRECTION DÉFINITIVE
      // Ton backend getMyFollowing renvoie : { following: [{ followingId, since }] }
      // Ton backend getMyFollowers renvoie : { followers: [{ followerId, since }] }
      // Il faut donc comparer sur ces champs précis, pas sur uid/id qui n'existent pas

      const myFollowing = followingRes.data?.following || [];
      const myFollowers = followersRes.data?.followers || [];

      // Est-ce que MOI je suis la cible ?
      // → targetUserId doit être dans followingId de ma liste following
      const doesIFollow = myFollowing.some(
        (u) => String(u.followingId) === String(targetUserId),
      );

      // Est-ce que la cible ME suit ?
      // → targetUserId doit être dans followerId de ma liste followers
      const doesTheyFollow = myFollowers.some(
        (u) => String(u.followerId) === String(targetUserId),
      );

      setIFollow(doesIFollow);
      setTheyFollowMe(doesTheyFollow);
    } catch (err) {
      console.error("Erreur fetchAll:", err);
      setError("Impossible de charger ce profil.");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return;
    setFollowLoading(true);
    try {
      const api = await authAxios();
      if (iFollow) {
        await api.delete(`/follows/${targetUserId}`);
        setIFollow(false);
      } else {
        await api.post(`/follows/${targetUserId}`);
        setIFollow(true);
      }
    } catch (err) {
      console.error("Erreur follow:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    setMsgLoading(true);
    try {
      const api = await authAxios();
      const res = await api.post("/conversations", { targetUserId });
      onOpenMessaging(res.data.conversation);
    } catch (err) {
      console.error("Erreur conversation:", err);
      alert(err.response?.data?.msg || "Impossible d'ouvrir la conversation.");
    } finally {
      setMsgLoading(false);
    }
  };

  const isMutual = iFollow && theyFollowMe;

  const getCoverUrl = (cover) => {
    if (!cover) return defaultCover;
    if (cover.image_id) {
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${cover.image_id}.jpg`;
    }
    if (
      typeof cover === "string" &&
      cover.trim() !== "" &&
      !cover.includes("undefined")
    ) {
      if (cover.startsWith("http")) return cover;
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${cover}.jpg`;
    }
    return defaultCover;
  };

  const statusMapping = {
    to_play: "⏳ À faire",
    playing: "🎮 En cours",
    finished: "✅ Fini",
    dropped: "❌ Abandonné",
  };

  if (loading) {
    return (
      <div
        className="accueil-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <div className="loading-spinner" />
        <p className="loading-text" style={{ marginTop: "16px" }}>
          Chargement du profil…
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div
        className="accueil-container"
        style={{ textAlign: "center", paddingTop: "80px" }}
      >
        <div className="empty-icon">😕</div>
        <h3 className="empty-title">Profil introuvable</h3>
        <p className="empty-text">{error}</p>
        <button
          className="category-btn"
          onClick={onBack}
          style={{ marginTop: "20px" }}
        >
          ← Retour
        </button>
      </div>
    );
  }

  return (
    <div className="accueil-container">
      {/* Bouton retour — z-index élevé pour rester cliquable */}
      <div style={{ position: "relative", zIndex: 10, padding: "20px 20px 0" }}>
        <button
          className="category-btn"
          onClick={onBack}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          ← Retour
        </button>
      </div>

      {/* Hero banner */}
      <div
        className="hero-section"
        style={{
          minHeight: "160px",
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(59,130,246,0.1) 100%)",
        }}
      >
        <div className="hero-gradient" />
      </div>

      <div
        style={{
          maxWidth: "640px",
          margin: "-80px auto 0",
          padding: "0 20px 60px",
        }}
      >
        <div
          className="game-card-modern"
          style={{ padding: "0", cursor: "default", overflow: "visible" }}
        >
          {/* Avatar flottant */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "-50px",
            }}
          >
            <img
              src={
                profile.avatar ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`
              }
              alt={profile.username}
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                border: "4px solid rgba(139, 92, 246, 0.6)",
                boxShadow: "0 0 30px rgba(139, 92, 246, 0.25)",
                objectFit: "cover",
                background: "#1a1a2e",
              }}
            />
          </div>

          <div style={{ padding: "16px 30px 30px", textAlign: "center" }}>
            <h2
              className="hero-title"
              style={{ fontSize: "1.8rem", margin: "10px 0 8px" }}
            >
              {profile.username}
            </h2>

            {/* Badges statut suivi */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              {isMutual && (
                <span
                  style={{
                    background: "rgba(34,197,94,0.12)",
                    border: "1px solid rgba(34,197,94,0.35)",
                    color: "#4ade80",
                    borderRadius: "20px",
                    padding: "3px 12px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                  }}
                >
                  ✓ Abonnement mutuel
                </span>
              )}
              {!isMutual && theyFollowMe && (
                <span
                  style={{
                    background: "rgba(59,130,246,0.12)",
                    border: "1px solid rgba(59,130,246,0.35)",
                    color: "#60a5fa",
                    borderRadius: "20px",
                    padding: "3px 12px",
                    fontSize: "0.75rem",
                  }}
                >
                  Vous suit
                </span>
              )}
              {iFollow && !theyFollowMe && (
                <span
                  style={{
                    background: "rgba(139,92,246,0.12)",
                    border: "1px solid rgba(139,92,246,0.35)",
                    color: "#a78bfa",
                    borderRadius: "20px",
                    padding: "3px 12px",
                    fontSize: "0.75rem",
                  }}
                >
                  Abonné
                </span>
              )}
            </div>

            {profile.bio && (
              <p
                className="hero-subtitle"
                style={{
                  fontSize: "0.9rem",
                  fontStyle: "italic",
                  opacity: 0.65,
                }}
              >
                "{profile.bio}"
              </p>
            )}

            {/* Stats */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                margin: "24px 0",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {[
                { label: "Jeux", value: profile.gamesCount },
                { label: "Abonnés", value: profile.followersCount },
                { label: "Abonnements", value: profile.followingCount },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    flex: 1,
                    padding: "18px 8px",
                    borderRight:
                      i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  }}
                >
                  <p
                    className="hero-title"
                    style={{
                      fontSize: "1.4rem",
                      margin: "0 0 4px",
                      fontWeight: "700",
                    }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="game-genre"
                    style={{ margin: 0, fontSize: "0.75rem", opacity: 0.6 }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Boutons d'action */}
            {currentUser && !isMe ? (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="nav-user-btn"
                  onClick={handleFollow}
                  disabled={followLoading}
                  style={{
                    minWidth: "150px",
                    justifyContent: "center",
                    opacity: followLoading ? 0.6 : 1,
                    transition: "all 0.2s",
                    ...(iFollow
                      ? { borderColor: "rgba(239,68,68,0.5)", color: "#f87171" }
                      : {}),
                  }}
                >
                  {followLoading
                    ? "…"
                    : iFollow
                      ? "✗ Se désabonner"
                      : "✚ Suivre"}
                </button>

                {isMutual && (
                  <button
                    className="nav-user-btn"
                    onClick={handleMessage}
                    disabled={msgLoading}
                    style={{
                      minWidth: "150px",
                      justifyContent: "center",
                      opacity: msgLoading ? 0.6 : 1,
                      background: "rgba(139,92,246,0.2)",
                      borderColor: "rgba(139,92,246,0.5)",
                    }}
                  >
                    {msgLoading ? "…" : "💬 Envoyer un message"}
                  </button>
                )}
              </div>
            ) : !currentUser ? (
              <p
                className="game-genre"
                style={{ opacity: 0.6, fontSize: "0.85rem" }}
              >
                Connectez-vous pour interagir avec cet utilisateur.
              </p>
            ) : null}

            {currentUser && !isMe && iFollow && !theyFollowMe && (
              <p
                style={{
                  marginTop: "14px",
                  fontSize: "0.78rem",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                En attente qu'il vous suive en retour pour pouvoir lui écrire.
              </p>
            )}
          </div>
        </div>

        {/* Collection publique */}
        <div style={{ marginTop: "40px" }}>
          <div className="section-header" style={{ marginBottom: "20px" }}>
            <h3 className="section-title">Sa Collection</h3>
            <span className="section-count">{library.length}</span>
          </div>

          {library.length === 0 ? (
            <p
              className="empty-text"
              style={{ textAlign: "center", padding: "20px" }}
            >
              Cet utilisateur n'a pas encore ajouté de jeux.
            </p>
          ) : (
            <div className="game-grid">
              {library.map((game) => (
                <div
                  key={game.gameId}
                  className="game-card-modern"
                  style={{ cursor: "pointer" }}
                  onClick={() => onGameClick && onGameClick(game.gameId)}
                >
                  <div className="game-image-container">
                    <img
                      src={getCoverUrl(game.gameCover || game.cover)}
                      alt={game.gameName || game.name}
                      className="game-image"
                    />
                  </div>
                  <div className="game-content">
                    <h4 className="game-title">{game.gameName || game.name}</h4>
                    <span
                      className="game-genre"
                      style={{ fontSize: "0.7rem", opacity: 0.8 }}
                    >
                      {statusMapping[game.status] || "Prévu"}
                    </span>
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

/* ═══════════════════════════════════════════════════════════
   MON PROFIL PERSONNEL — isPublic !== true
═══════════════════════════════════════════════════════════ */
const MyProfile = ({
  user,
  onLoginSuccess,
  onLogout,
  onGameClick,
  onAdminClick,
}) => {
  const { t, i18n } = useTranslation();

  const [profileData, setProfileData] = useState({
    pseudo: user?.username || user?.pseudo || user?.displayName || "Joueur",
    email: user?.email || "",
    bio: user?.bio || "",
    role: user?.role || "",
    avatar:
      user?.avatar ||
      user?.photoURL ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || user?.pseudo || user?.displayName || "Joueur"}`,
  });

  const [favorites, setFavorites] = useState([]);
  const [filter, setFilter] = useState("Tous");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    if (user) {
      fetchMyFullProfile();
      fetchLibrary();
    }
  }, [user]);

  const fetchMyFullProfile = async () => {
    try {
      const api = await authAxios();
      const res = await api.get("/users/profile");
      if (res.data.success && res.data.user) {
        const u = res.data.user;
        const fullProfile = {
          ...profileData,
          pseudo: u.username || u.pseudo || profileData.pseudo,
          bio: u.bio || profileData.bio,
          avatar: u.avatar || u.photoURL || profileData.avatar,
          role: u.role || "",
        };
        setProfileData(fullProfile);
        // Indispensable pour mettre à jour l'état global du user dans App.jsx
        if (onLoginSuccess) onLoginSuccess(fullProfile);
      }
    } catch (err) {
      console.warn("Erreur fetch profile perso", err);
    }
  };

  const fetchLibrary = async () => {
    try {
      const api = await authAxios();
      const res = await api.get(`/lists/library`);
      setFavorites(res.data?.library || []);
    } catch (err) {
      console.warn("Bibliothèque : erreur.", err.message);
    }
  };

  const handleStatusUpdate = async (gameId, newStatus, gameName, gameCover) => {
    try {
      const api = await authAxios();
      await api.post("/lists/status", {
        gameId: String(gameId),
        status: newStatus,
        gameName,
        gameCover,
      });
      setFavorites((prev) =>
        prev.map((g) =>
          g.gameId === gameId ? { ...g, status: newStatus } : g,
        ),
      );
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut", err);
    }
  };

  const statusMapping = {
    to_play: "A faire",
    playing: "En cours",
    finished: "Fini",
    dropped: "Abandonné",
  };

  const filteredGames = favorites.filter((game) => {
    if (filter === "Tous") return true;
    return statusMapping[game.status] === filter;
  });

  const getCoverUrl = (cover) => {
    if (!cover) return defaultCover;
    if (cover.image_id) {
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${cover.image_id}.jpg`;
    }
    if (
      typeof cover === "string" &&
      cover.trim() !== "" &&
      !cover.includes("undefined")
    ) {
      if (cover.startsWith("http")) return cover;
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${cover}.jpg`;
    }
    return defaultCover;
  };

  const handleUpdate = async () => {
    setSaveStatus("saving");
    try {
      const api = await authAxios();
      await api.put("/users/profile", {
        username: profileData.pseudo || profileData.username,
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
                {profileData.role === "admin" && (
                  <button
                    className="nav-user-btn"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      background: "rgba(167, 139, 250, 0.2)",
                      borderColor: "#a78bfa",
                    }}
                    onClick={onAdminClick}
                  >
                    🛡️ Dashboard Admin
                  </button>
                )}
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

        <div className="profile-content">
          <div className="section-header" style={{ marginBottom: "20px" }}>
            <h2 className="section-title">Ma Collection</h2>
            <span className="section-count">{filteredGames.length}</span>
          </div>

          <div className="filters-container" style={{ marginBottom: "30px" }}>
            {["Tous", "A faire", "En cours", "Fini", "Abandonné"].map((s) => (
              <button
                key={s}
                className={`category-btn ${filter === s ? "active" : ""}`}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {filteredGames.length === 0 ? (
            <div
              className="game-card-modern"
              style={{
                padding: "40px",
                textAlign: "center",
                cursor: "default",
              }}
            >
              <p className="hero-subtitle">
                {favorites.length === 0
                  ? "La bibliothèque est vide..."
                  : `Aucun jeu dans la catégorie "${filter}"`}
              </p>
            </div>
          ) : (
            <div className="game-grid">
              {filteredGames.map((game) => (
                <div
                  key={game.gameId}
                  className="game-card-modern"
                  onClick={() => onGameClick && onGameClick(game.gameId)}
                >
                  <div className="game-image-container">
                    <img
                      src={getCoverUrl(game.gameCover || game.cover)}
                      alt={game.gameName || game.name}
                      className="game-image"
                    />
                  </div>
                  <div className="game-content">
                    <h4 className="game-title">{game.gameName || game.name}</h4>
                    <select
                      className={`status-select ${
                        statusMapping[game.status]
                          ?.toLowerCase()
                          .replace(" ", "-") || ""
                      }`}
                      value={game.status || "to_play"}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        handleStatusUpdate(
                          game.gameId,
                          e.target.value,
                          game.gameName || game.name,
                          game.gameCover || game.cover,
                        )
                      }
                    >
                      <option value="to_play">⏳ À faire</option>
                      <option value="playing">🎮 En cours</option>
                      <option value="finished">✅ Fini</option>
                      <option value="dropped">❌ Abandonné</option>
                    </select>
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

/* ═══════════════════════════════════════════════════════════
   EXPORT
═══════════════════════════════════════════════════════════ */
const Utilisateur = ({
  user,
  onLoginSuccess,
  onLogout,
  isPublic,
  targetUserId,
  onBack,
  onOpenMessaging,
  onGameClick,
  onAdminClick,
}) => {
  if (isPublic) {
    return (
      <PublicProfile
        targetUserId={targetUserId}
        currentUser={user}
        onBack={onBack}
        onOpenMessaging={onOpenMessaging}
        onGameClick={onGameClick}
      />
    );
  }
  return (
    <MyProfile
      user={user}
      onLoginSuccess={onLoginSuccess}
      onLogout={onLogout}
      onGameClick={onGameClick}
      onAdminClick={onAdminClick}
    />
  );
};

export default Utilisateur;
