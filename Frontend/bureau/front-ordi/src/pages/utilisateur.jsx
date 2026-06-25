import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { auth } from "../Service/firebase";
import { updateProfile } from "firebase/auth";
import { statusConfig } from "../Utils/icons";
import "../../Style/Styles.css";
import defaultCover from "../assets/fr-default-large_default.jpg";
import Footer from "../components/Footer";

const authAxios = async () => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  const token = await firebaseUser.getIdToken(true);
  return axios.create({
    baseURL: "http://localhost:3000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

// PublicProfile : Vue affichant la bibliothèque, les listes et le statut de suivi d'un utilisateur tiers
const PublicProfile = ({
  targetUserId,
  currentUser,
  onBack,
  onOpenMessaging,
  onGameClick,
}) => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [iFollow, setIFollow] = useState(false);
  const [theyFollowMe, setTheyFollowMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [error, setError] = useState("");
  const [library, setLibrary] = useState([]);
  const [customLists, setCustomLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const myId = String(currentUser?.uid || currentUser?.id || "");
  const isMe = myId !== "" && myId === String(targetUserId);

  useEffect(() => {
    if (profile?.username) {
      document.title = `${t("public_profile_title", { name: profile.username })} | TGMF`;
    } else {
      document.title = `${t("profile_tab_title")} | TGMF`;
    }
  }, [profile?.username]);

  useEffect(() => {
    fetchAll();
  }, [targetUserId]);

  const fetchAll = async () => {
    if (!targetUserId) return;
    setLoading(true);
    setError("");
    try {
      const api = await authAxios();

      if (!api) {
        setError(t("error_login_required"));
        setLoading(false);
        return;
      }

      const profileReq = api.get(`/users/${targetUserId}/profile`);
      const libraryReq = api
        .get(`/lists/library?userId=${targetUserId}`)
        .catch(() => ({ data: { library: [] } }));

      const followingReq = api
        .get("/follows/me/following")
        .catch(() => ({ data: { following: [] } }));
      const followersReq = api
        .get("/follows/me/followers")
        .catch(() => ({ data: { followers: [] } }));

      let customListsReq;
      try {
        customListsReq = await api.get(`/lists/custom/user/${targetUserId}`);
      } catch (err) {
        try {
          customListsReq = await api.get(
            `/lists/custom?userId=${targetUserId}`,
          );
        } catch (err2) {
          customListsReq = { data: { lists: [] } };
        }
      }

      const [profileRes, libraryRes, followingRes, followersRes] =
        await Promise.all([profileReq, libraryReq, followingReq, followersReq]);

      const data = profileRes.data;
      const userData = data?.user || data;
      const lib = libraryRes.data?.library || [];

      setProfile({
        username: userData.username || userData.pseudo || t("default_username"),
        bio: userData.bio || "",
        website: userData.website || "",
        avatar:
          userData.avatar ||
          userData.profileData?.avatarUrl ||
          userData.photoURL ||
          null,
        followersCount: userData.followersCount || 0,
        followingCount: userData.followingCount || 0,
        gamesCount: lib.length,
        isCertified: userData.isCertified || false,
        isPrivate: userData.isPrivate || false,
      });

      setLibrary(lib);
      setCustomLists(
        (customListsReq.data?.lists || []).filter((l) => !l.isPrivate),
      );

      const myFollowing = followingRes.data?.following || [];
      const myFollowers = followersRes.data?.followers || [];
      setIFollow(
        myFollowing.some((u) => String(u.followingId) === String(targetUserId)),
      );
      setTheyFollowMe(
        myFollowers.some((u) => String(u.followerId) === String(targetUserId)),
      );
    } catch (err) {
      console.error("Erreur fetchAll:", err);
      setError(t("error_profile_load"));
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
        setProfile((prev) => ({
          ...prev,
          followersCount: Math.max(0, (Number(prev.followersCount) || 0) - 1),
        }));
      } else {
        await api.post(`/follows/${targetUserId}`);
        setIFollow(true);
        setProfile((prev) => ({
          ...prev,
          followersCount: (Number(prev.followersCount) || 0) + 1,
        }));
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
      showToast(err.response?.data?.msg || t("error_conversation_open"));
    } finally {
      setMsgLoading(false);
    }
  };

  const isMutual = iFollow && theyFollowMe;

  const getCoverUrl = (cover) => {
    if (!cover) return defaultCover;
    if (cover.image_id)
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${cover.image_id}.jpg`;
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

  const renderStatus = (status) => {
    const cfg = statusConfig[status] || statusConfig.to_play;
    return (
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        <i
          className={cfg.icon}
          style={{ color: cfg.color, marginRight: "8px" }}
        ></i>
        {cfg.label}
      </span>
    );
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
          {t("loading_profile")}
        </p>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div
        className="accueil-container"
        style={{ textAlign: "center", paddingTop: "80px" }}
      >
        <div className="empty-icon">
          <i
            className="fa-solid fa-ghost"
            style={{ color: "rgb(148, 163, 184)" }}
          ></i>
        </div>
        <h3 className="empty-title">{t("profile_not_found")}</h3>
        <p className="empty-text">{error}</p>
        <button
          className="category-btn"
          onClick={onBack}
          style={{ marginTop: "20px" }}
        >
          {t("btn_back")}
        </button>
        <Footer />
      </div>
    );
  }

  return (
    <div className="accueil-container">
      <div style={{ position: "relative", zIndex: 10, padding: "20px 20px 0" }}>
        <button
          className="category-btn"
          onClick={onBack}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <i className="fa-solid fa-arrow-left"></i> {t("btn_back")}
        </button>
      </div>

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
              {profile.isCertified && (
                <span
                  title={t("certified_profile")}
                  style={{
                    marginLeft: "10px",
                    fontSize: "1.2rem",
                    verticalAlign: "middle",
                  }}
                >
                  <i
                    className="fa-solid fa-star"
                    style={{ color: "rgb(255, 212, 59)" }}
                  ></i>
                </span>
              )}
            </h2>

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
                  <i
                    className="fa-solid fa-check"
                    style={{ color: "rgb(34, 197, 94)", marginRight: "4px" }}
                  ></i>{" "}
                  {t("badge_mutual")}
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
                  {t("badge_follows_you")}
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
                  {t("badge_subscribed")}
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
                { label: t("stat_followers"), value: profile.followersCount },
                { label: t("stat_following"), value: profile.followingCount },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    flex: 1,
                    padding: "18px 8px",
                    borderRight:
                      i < 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
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
                    ...(iFollow
                      ? { borderColor: "rgba(239,68,68,0.5)", color: "#f87171" }
                      : {}),
                  }}
                >
                  {followLoading ? (
                    "…"
                  ) : iFollow ? (
                    <>
                      <i
                        className="fa-solid fa-xmark"
                        style={{
                          color: "rgb(239, 68, 68)",
                          marginRight: "5px",
                        }}
                      ></i>{" "}
                      {t("btn_unfollow")}
                    </>
                  ) : (
                    <>
                      <i
                        className="fa-solid fa-user-plus"
                        style={{ marginRight: "5px" }}
                      ></i>{" "}
                      {t("btn_follow")}
                    </>
                  )}
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
                    {msgLoading ? (
                      "…"
                    ) : (
                      <>
                        <i
                          className="fa-solid fa-message"
                          style={{ color: "#c084fc", marginRight: "5px" }}
                        ></i>{" "}
                        {t("btn_send_message")}
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* ── GESTION DE LA CONFIDENTIALITÉ ── */}
        {profile.isPrivate && !isMutual ? (
          <div
            className="game-card-modern"
            style={{
              marginTop: "40px",
              padding: "60px 20px",
              textAlign: "center",
              cursor: "default",
            }}
          >
            <div
              style={{ fontSize: "3.5rem", marginBottom: "16px", opacity: 0.8 }}
            >
              <i
                className="fa-solid fa-lock"
                style={{ color: "rgb(148, 163, 184)" }}
              ></i>
            </div>
            <h3
              className="section-title"
              style={{
                fontSize: "1.5rem",
                marginBottom: "8px",
                justifyContent: "center",
                border: "none",
              }}
            >
              {t("private_account_title")}
            </h3>
            <p
              className="hero-subtitle"
              style={{ fontSize: "0.95rem", margin: 0, opacity: 0.7 }}
            >
              {t("private_account_desc")}
            </p>
          </div>
        ) : (
          <>
            {/* ── Collection publique ── */}
            <div style={{ marginTop: "40px" }}>
              <div className="section-header" style={{ marginBottom: "20px" }}>
                <h3 className="section-title">
                  {t("public_collection_title")}
                </h3>
              </div>
              {library.length === 0 ? (
                <p
                  className="empty-text"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  {t("public_collection_empty")}
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
                        <h4 className="game-title">
                          {game.gameName || game.name}
                        </h4>
                        <span
                          className="game-genre"
                          style={{ fontSize: "0.7rem", opacity: 0.8 }}
                        >
                          {renderStatus(game.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Listes personnalisées publiques ── */}
            {customLists.length > 0 && (
              <div style={{ marginTop: "40px" }}>
                <div
                  className="section-header"
                  style={{ marginBottom: "20px" }}
                >
                  <h3 className="section-title">{t("public_lists_title")}</h3>
                  <span className="section-count">{customLists.length}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {customLists.map((list) => {
                    const isOpen = activeListId === list.id;

                    return (
                      <div
                        key={list.id}
                        className="game-card-modern"
                        style={{
                          padding: "0",
                          cursor: "default",
                          position: "relative",
                          zIndex: isOpen ? 50 : 1,
                        }}
                      >
                        <div
                          onClick={() =>
                            setActiveListId(isOpen ? null : list.id)
                          }
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "16px 20px",
                            cursor: "pointer",
                          }}
                        >
                          <div>
                            <h4
                              className="game-title"
                              style={{
                                margin: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              {list.name}
                            </h4>
                            {list.description && (
                              <p
                                style={{
                                  fontSize: "0.82rem",
                                  color: "#94a3b8",
                                  margin: "4px 0 0",
                                }}
                              >
                                {list.description}
                              </p>
                            )}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <span
                              className="section-count"
                              style={{ fontSize: "0.75rem" }}
                            >
                              {t("list_game_count", {
                                count: (list.games || []).length,
                              })}
                            </span>
                            <i
                              className={
                                isOpen
                                  ? "fa-solid fa-chevron-up"
                                  : "fa-solid fa-chevron-down"
                              }
                              style={{ color: "#9333ea" }}
                            ></i>
                          </div>
                        </div>

                        {isOpen ? (
                          <div
                            style={{
                              padding: "0 20px 20px",
                              borderTop: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            {(list.games || []).length === 0 ? (
                              <p
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#64748b",
                                  paddingTop: "16px",
                                  textAlign: "center",
                                }}
                              >
                                {t("list_empty")}
                              </p>
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  gap: "12px",
                                  flexWrap: "wrap",
                                  paddingTop: "16px",
                                }}
                              >
                                {(list.games || []).map((g) => (
                                  <div
                                    key={g.gameId}
                                    onClick={() =>
                                      onGameClick && onGameClick(g.gameId)
                                    }
                                    style={{ width: "70px", cursor: "pointer" }}
                                  >
                                    <img
                                      src={getCoverUrl(g.gameCover)}
                                      alt={g.gameName}
                                      style={{
                                        width: "70px",
                                        height: "90px",
                                        borderRadius: "8px",
                                        objectFit: "cover",
                                      }}
                                    />
                                    <p
                                      style={{
                                        fontSize: "0.65rem",
                                        color: "#94a3b8",
                                        margin: "6px 0 0",
                                        textAlign: "center",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {g.gameName}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: "0 20px 20px",
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            {(list.games || []).slice(0, 5).map((g) => (
                              <div
                                key={g.gameId}
                                onClick={() =>
                                  onGameClick && onGameClick(g.gameId)
                                }
                                style={{
                                  width: "50px",
                                  height: "65px",
                                  borderRadius: "6px",
                                  overflow: "hidden",
                                  cursor: "pointer",
                                  flexShrink: 0,
                                }}
                              >
                                <img
                                  src={getCoverUrl(g.gameCover)}
                                  alt={g.gameName}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              </div>
                            ))}
                            {(list.games || []).length > 5 && (
                              <div
                                style={{
                                  width: "50px",
                                  height: "65px",
                                  borderRadius: "6px",
                                  background: "rgba(147,51,234,0.2)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.75rem",
                                  color: "#c084fc",
                                  fontWeight: "600",
                                }}
                              >
                                +{(list.games || []).length - 5}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

// CustomLists : Logique de gestion des collections de jeux personnalisées (Création/Édition/Suppression)
const CustomLists = ({ onGameClick }) => {
  const { t } = useTranslation();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });
  const [saving, setSaving] = useState(false);
  const [gameSearch, setGameSearch] = useState("");
  const [gameResults, setGameResults] = useState([]);
  const [searchingGames, setSearchingGames] = useState(false);
  const [activeListId, setActiveListId] = useState(null);

  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    if (!gameSearch || gameSearch.length < 2) {
      setGameResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingGames(true);
      try {
        const api = await authAxios();
        const res = await api.get(
          `/games/search?q=${encodeURIComponent(gameSearch)}&limit=6`,
        );
        setGameResults(res.data || []);
      } catch (_) {
      } finally {
        setSearchingGames(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [gameSearch]);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const api = await authAxios();
      const res = await api.get("/lists/custom/me");
      setLists(res.data?.lists || []);
    } catch (err) {
      console.warn("Erreur fetchLists:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveList = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      const api = await authAxios();
      if (editingList) {
        await api.put(`/lists/custom/${editingList.id}`, formData);
        setLists((prev) =>
          prev.map((l) =>
            l.id === editingList.id ? { ...l, ...formData } : l,
          ),
        );
      } else {
        const res = await api.post("/lists/custom", formData);
        setLists((prev) => [
          ...prev,
          { id: res.data.listId, ...formData, games: [] },
        ]);
      }
      setShowForm(false);
      setEditingList(null);
      setFormData({ name: "", description: "", isPrivate: false });
    } catch (err) {
      console.error("Erreur save list:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteList = (id) => {
    setConfirmDialog({
      message: t("confirm_delete_list"),
      onConfirm: async () => {
        try {
          const api = await authAxios();
          await api.delete(`/lists/custom/${id}`);
          setLists((prev) => prev.filter((l) => l.id !== id));
          showToast(t("toast_list_deleted"), "success");
        } catch (err) {
          showToast(t("toast_list_delete_error"));
        }
      },
    });
  };

  const handleAddGame = async (list, game) => {
    try {
      const api = await authAxios();
      const gameEntry = {
        gameId: String(game.id),
        gameName: game.name,
        gameCover: game.cover?.image_id
          ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
          : "",
      };
      await api.post(`/lists/custom/${list.id}/games`, gameEntry);
      setLists((prev) =>
        prev.map((l) =>
          l.id === list.id
            ? { ...l, games: [...(l.games || []), gameEntry] }
            : l,
        ),
      );
      setGameSearch("");
      setGameResults([]);
    } catch (err) {
      console.error("Erreur addGame:", err);
    }
  };

  const handleRemoveGame = async (listId, gameId) => {
    try {
      const api = await authAxios();
      await api.delete(`/lists/custom/${listId}/games/${gameId}`);
      setLists((prev) =>
        prev.map((l) =>
          l.id === listId
            ? {
                ...l,
                games: (l.games || []).filter((g) => g.gameId !== gameId),
              }
            : l,
        ),
      );
    } catch (err) {}
  };

  const openEdit = (list) => {
    setEditingList(list);
    setFormData({
      name: list.name,
      description: list.description || "",
      isPrivate: list.isPrivate || false,
    });
    setShowForm(true);
  };

  const getCoverUrl = (cover) => {
    if (!cover) return defaultCover;
    if (typeof cover === "string" && cover.startsWith("http")) return cover;
    if (cover.image_id)
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${cover.image_id}.jpg`;
    return defaultCover;
  };

  return (
    <div>
      <div className="section-header" style={{ marginBottom: "20px" }}>
        <h2 className="section-title">{t("section_lists")}</h2>
        <button
          className="category-btn active"
          onClick={() => {
            setShowForm(!showForm);
            setEditingList(null);
            setFormData({ name: "", description: "", isPrivate: false });
          }}
        >
          {showForm && !editingList ? (
            <>
              <i
                className="fa-solid fa-xmark"
                style={{ marginRight: "6px" }}
              ></i>{" "}
              {t("btn_cancel")}
            </>
          ) : (
            <>
              <i
                className="fa-solid fa-plus"
                style={{ marginRight: "6px" }}
              ></i>{" "}
              {t("btn_new_list")}
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div
          className="game-card-modern"
          style={{ padding: "20px", marginBottom: "24px", cursor: "default" }}
        >
          <h4 className="game-title" style={{ marginBottom: "16px" }}>
            {editingList
              ? t("form_edit_list_title")
              : t("form_create_list_title")}
          </h4>
          <input
            className="filter-select"
            style={{ width: "100%", marginBottom: "10px" }}
            placeholder={t("form_list_name_placeholder")}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <textarea
            className="filter-select"
            style={{
              width: "100%",
              minHeight: "70px",
              marginBottom: "10px",
              paddingTop: "10px",
            }}
            placeholder={t("form_list_desc_placeholder")}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) =>
                setFormData({ ...formData, isPrivate: e.target.checked })
              }
              style={{ accentColor: "#9333ea" }}
            />
            <label
              htmlFor="isPrivate"
              className="game-genre"
              style={{ cursor: "pointer", margin: 0 }}
            >
              <i
                className="fa-solid fa-lock"
                style={{ color: "inherit", opacity: 0.6, marginRight: "6px" }}
              ></i>{" "}
              {t("form_list_private_label")}
            </label>
          </div>
          <button
            className="nav-user-btn"
            style={{
              width: "100%",
              justifyContent: "center",
              opacity: saving ? 0.6 : 1,
            }}
            onClick={handleSaveList}
            disabled={saving}
          >
            {saving ? (
              t("saving")
            ) : editingList ? (
              <>
                <i
                  className="fa-solid fa-pen-to-square"
                  style={{ marginRight: "6px" }}
                ></i>{" "}
                {t("btn_update")}
              </>
            ) : (
              <>
                <i
                  className="fa-solid fa-check"
                  style={{ marginRight: "6px" }}
                ></i>{" "}
                {t("btn_create_list")}
              </>
            )}
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      ) : lists.length === 0 ? (
        <div
          className="game-card-modern"
          style={{ padding: "40px", textAlign: "center", cursor: "default" }}
        >
          <p style={{ fontSize: "2rem", marginBottom: "12px", opacity: 0.6 }}>
            <i className="fa-solid fa-clipboard-list"></i>
          </p>
          <p className="hero-subtitle">{t("lists_empty")}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {lists.map((list) => {
            const isOpen = activeListId === list.id;
            return (
              <div
                key={list.id}
                className="game-card-modern"
                style={{
                  padding: "0",
                  cursor: "default",
                  overflow: "visible",
                  position: "relative",
                  zIndex: isOpen ? 9999 : 1,
                }}
              >
                <div
                  onClick={() => setActiveListId(isOpen ? null : list.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 20px",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <h4
                        className="game-title"
                        style={{ margin: 0, fontSize: "1rem" }}
                      >
                        {list.name}
                      </h4>
                      {list.isPrivate ? (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            backgroundColor: "rgba(239, 68, 68, 0.15)",
                            color: "#ef4444",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                          }}
                        >
                          <i
                            className="fa-solid fa-lock"
                            style={{ marginRight: "4px" }}
                          ></i>
                          {t("badge_private")}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            backgroundColor: "rgba(34, 197, 94, 0.15)",
                            color: "#22c55e",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid rgba(34, 197, 94, 0.3)",
                          }}
                        >
                          <i
                            className="fa-solid fa-earth-americas"
                            style={{ marginRight: "4px" }}
                          ></i>
                          {t("badge_public")}
                        </span>
                      )}
                      <span
                        className="section-count"
                        style={{ fontSize: "0.72rem" }}
                      >
                        {t("list_game_count", {
                          count: (list.games || []).length,
                        })}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                      flexShrink: 0,
                      marginLeft: "12px",
                    }}
                  >
                    <button
                      className="category-btn"
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.75rem",
                        borderColor: "rgba(59, 130, 246, 0.5)",
                        background: "rgba(59, 130, 246, 0.1)",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(list);
                      }}
                    >
                      <i
                        className="fa-solid fa-pen-to-square"
                        style={{ color: "#3b82f6" }}
                      ></i>
                    </button>

                    <button
                      className="category-btn"
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.75rem",
                        borderColor: "rgba(239, 68, 68, 0.5)",
                        background: "rgba(239, 68, 68, 0.1)",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteList(list.id);
                      }}
                    >
                      <i
                        className="fa-solid fa-trash"
                        style={{ color: "#ef4444" }}
                      ></i>
                    </button>
                    <i
                      className={
                        isOpen
                          ? "fa-solid fa-chevron-up"
                          : "fa-solid fa-chevron-down"
                      }
                      style={{ color: "#9333ea", marginLeft: "6px" }}
                    ></i>
                  </div>
                </div>

                {isOpen && (
                  <div
                    style={{
                      padding: "0 20px 20px",
                      borderTop: "1px solid rgba(128,128,128,0.1)",
                    }}
                  >
                    {(list.games || []).length === 0 ? (
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#64748b",
                          padding: "16px 0 8px",
                          textAlign: "center",
                        }}
                      >
                        {t("list_empty_add_hint")}
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                          padding: "16px 0 12px",
                        }}
                      >
                        {(list.games || []).map((g) => (
                          <div
                            key={g.gameId}
                            style={{ position: "relative", width: "70px" }}
                          >
                            <div
                              onClick={() =>
                                onGameClick && onGameClick(g.gameId)
                              }
                              style={{
                                width: "70px",
                                height: "90px",
                                borderRadius: "8px",
                                overflow: "hidden",
                                cursor: "pointer",
                              }}
                            >
                              <img
                                src={getCoverUrl(g.gameCover)}
                                alt={g.gameName}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                            <button
                              onClick={() =>
                                handleRemoveGame(list.id, g.gameId)
                              }
                              style={{
                                position: "absolute",
                                top: "-6px",
                                right: "-6px",
                                background: "#ef4444",
                                border: "none",
                                borderRadius: "50%",
                                width: "18px",
                                height: "18px",
                                cursor: "pointer",
                                color: "#fff",
                                fontSize: "0.6rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                lineHeight: 1,
                              }}
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                            <p
                              style={{
                                fontSize: "0.65rem",
                                color: "#94a3b8",
                                margin: "4px 0 0",
                                textAlign: "center",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {g.gameName}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ position: "relative", marginTop: "8px" }}>
                      <input
                        className="filter-select"
                        style={{ width: "100%" }}
                        placeholder={t("list_add_game_placeholder")}
                        value={gameSearch}
                        onChange={(e) => setGameSearch(e.target.value)}
                        onBlur={() => setTimeout(() => setGameResults([]), 200)}
                      />
                      {searchingGames && (
                        <span
                          style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#64748b",
                            fontSize: "0.75rem",
                          }}
                        >
                          …
                        </span>
                      )}
                      {gameResults.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "calc(100% + 6px)",
                            left: 0,
                            right: 0,
                            background: "var(--bg-secondary, #1a1a2e)",
                            border: "1px solid rgba(147,51,234,0.3)",
                            borderRadius: "10px",
                            zIndex: 99999,
                            pointerEvents: "auto",
                            overflow: "hidden",
                            boxShadow: "0 15px 40px rgba(0,0,0,0.8)",
                          }}
                        >
                          {gameResults.map((g) => (
                            <div
                              key={g.id}
                              onMouseDown={() => handleAddGame(list, g)}
                              style={{
                                padding: "10px 14px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(147,51,234,0.15)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              {g.cover?.image_id && (
                                <img
                                  src={`https://images.igdb.com/igdb/image/upload/t_thumb/${g.cover.image_id}.jpg`}
                                  alt=""
                                  style={{
                                    width: "28px",
                                    height: "36px",
                                    borderRadius: "4px",
                                    objectFit: "cover",
                                  }}
                                />
                              )}
                              <span
                                style={{ color: "inherit", fontSize: "0.9rem" }}
                              >
                                {g.name}
                              </span>
                              {(list.games || []).some(
                                (lg) => String(lg.gameId) === String(g.id),
                              ) && (
                                <span
                                  style={{
                                    marginLeft: "auto",
                                    color: "#4ade80",
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  <i
                                    className="fa-solid fa-check"
                                    style={{ marginRight: "4px" }}
                                  ></i>{" "}
                                  {t("badge_added")}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: toast.type === "success" ? "#22c55e" : "#ef4444",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            zIndex: 99999,
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <i
            className={`fa-solid ${toast.type === "success" ? "fa-check" : "fa-circle-exclamation"}`}
            style={{ marginRight: "8px" }}
          ></i>
          {toast.msg}
        </div>
      )}
      {confirmDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#111118",
              border: "1px solid #1e1e2a",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "100%",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                color: "#e8e8f0",
                fontSize: "1.1rem",
              }}
            >
              {t("confirm_title")}
            </h3>
            <p
              style={{
                color: "#9ca3af",
                marginBottom: "24px",
                fontSize: "0.95rem",
              }}
            >
              {confirmDialog.message}
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="category-btn"
                onClick={() => setConfirmDialog(null)}
              >
                {t("btn_cancel")}
              </button>
              <button
                className="nav-user-btn"
                style={{ background: "#ef4444" }}
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
              >
                {t("btn_confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// MyProfile : Tableau de bord privé permettant à l'utilisateur de gérer ses paramètres et sa collection
const MyProfile = ({ user, onLoginSuccess, onLogout, onGameClick }) => {
  const { t, i18n } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    uid: user?.uid || user?.id || "",
    pseudo:
      user?.username ||
      user?.pseudo ||
      user?.displayName ||
      t("default_username"),
    email: user?.email || "",
    bio: user?.bio || "",
    website: user?.profileData?.website || "",
    birthDate: user?.birthDate || "",
    followersCount: 0,
    followingCount: 0,
    isPrivate: user?.isPrivate || false,
    avatar:
      user?.avatar ||
      user?.photoURL ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || user?.pseudo || user?.displayName || "Joueur"}`,
  });

  const [favorites, setFavorites] = useState([]);
  const [filter, setFilter] = useState("Tous");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    document.title = `${t("profileTitle")} | TGMF`;
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyFullProfile();
      fetchLibrary();
    }
  }, [user?.uid]);

  const fetchMyFullProfile = async () => {
    try {
      const api = await authAxios();
      if (!api) return;

      const profileReq = api.get("/users/profile");
      const followingReq = api
        .get("/follows/me/following")
        .catch(() => ({ data: { following: [] } }));
      const followersReq = api
        .get("/follows/me/followers")
        .catch(() => ({ data: { followers: [] } }));

      const [res, followingRes, followersRes] = await Promise.all([
        profileReq,
        followingReq,
        followersReq,
      ]);

      if (res.data.success && res.data.user) {
        const u = res.data.user;

        const actualFollowersCount =
          followersRes.data?.followers?.length || u.followersCount || 0;
        const actualFollowingCount =
          followingRes.data?.following?.length || u.followingCount || 0;

        const fullProfile = {
          uid: u.uid || u.userId || profileData.uid,
          ...profileData,
          pseudo: u.username || u.pseudo || profileData.pseudo,
          bio: u.bio || profileData.bio,
          website: u.profileData?.website || "",
          avatar: u.avatar || u.photoURL || profileData.avatar,
          birthDate: u.birthDate || "",
          isCertified: u.isCertified || false,
          isPrivate: u.isPrivate || u.preferences?.privateProfile || false,
          followersCount: actualFollowersCount,
          followingCount: actualFollowingCount,
        };
        setProfileData(fullProfile);
        if (onLoginSuccess) {
          onLoginSuccess({
            ...user,
            ...fullProfile,
            pseudo: fullProfile.pseudo,
            username: fullProfile.pseudo,
            displayName: fullProfile.pseudo,
            avatarUrl: fullProfile.avatar,
            photoURL: fullProfile.avatar,
          });
        }
      }
    } catch (err) {
      console.warn("Erreur fetch profile perso", err);
    }
  };

  const fetchLibrary = async () => {
    try {
      const api = await authAxios();
      if (!api) return;
      const res = await api.get(`/lists/library`);
      setFavorites(res.data?.library || []);
    } catch (err) {
      console.warn("Bibliothèque : erreur.", err.message);
    }
  };

  const handleStatusUpdate = async (gameId, newStatus, gameName, gameCover) => {
    try {
      const api = await authAxios();
      if (!api) return;
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

  const handleUpdate = async () => {
    setSaveStatus("saving");
    try {
      const api = await authAxios();
      if (!api) throw new Error("Erreur authentification");

      const payload = {
        username: profileData.pseudo,
        bio: profileData.bio,
      };
      if (profileData.website) payload.website = profileData.website;
      if (
        profileData.avatar &&
        (profileData.avatar.startsWith("http") ||
          profileData.avatar.startsWith("data:image/"))
      )
        payload.avatarUrl = profileData.avatar;
      if (profileData.birthDate) payload.birthDate = profileData.birthDate;

      await api.put("/users/profile", payload);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: profileData.pseudo,
          photoURL:
            profileData.avatar && profileData.avatar.startsWith("http")
              ? profileData.avatar
              : auth.currentUser.photoURL,
        });
        await auth.currentUser.reload();
      }

      if (onLoginSuccess) {
        onLoginSuccess({
          ...user,
          ...profileData,
          pseudo: profileData.pseudo,
          username: profileData.pseudo,
          displayName: profileData.pseudo,
          avatarUrl: profileData.avatar,
          photoURL: profileData.avatar,
        });
      }
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus("");
        setIsEditing(false);
        if (!onLoginSuccess) {
          window.location.reload();
        }
      }, 1500);
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
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 250;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setProfileData({ ...profileData, avatar: dataUrl });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const getAge = (birthDateString) => {
    if (!birthDateString) return null;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };
  const userAge = getAge(profileData.birthDate);

  // Les clés internes restent en FR pour matcher countByStatus
  const FILTERS = [
    { key: "filter_all", status: "Tous" },
    { key: "filter_to_play", status: "A faire" },
    { key: "filter_playing", status: "En cours" },
    { key: "filter_finished", status: "Fini" },
    { key: "filter_dropped", status: "Abandonné" },
  ];

  const filteredGames = favorites.filter((game) => {
    if (filter === "Tous") return true;
    const filterMapping = {
      to_play: "A faire",
      playing: "En cours",
      finished: "Fini",
      dropped: "Abandonné",
    };
    return filterMapping[game.status] === filter;
  });

  const getCoverUrl = (cover) => {
    if (!cover) return defaultCover;
    if (cover.image_id)
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${cover.image_id}.jpg`;
    if (typeof cover === "string" && cover.startsWith("http")) return cover;
    return defaultCover;
  };

  const totalGames = favorites.length;
  const countByStatus = {
    Tous: totalGames,
    "A faire": favorites.filter((g) => g.status === "to_play").length,
    "En cours": favorites.filter((g) => g.status === "playing").length,
    Fini: favorites.filter((g) => g.status === "finished").length,
    Abandonné: favorites.filter((g) => g.status === "dropped").length,
  };

  const saveLabel = {
    saving: t("saving"),
    saved: (
      <>
        <i
          className="fa-solid fa-check"
          style={{ color: "rgb(34, 197, 94)", marginRight: "5px" }}
        ></i>{" "}
        {t("alertSuccess")}
      </>
    ),
    error: (
      <>
        <i
          className="fa-solid fa-xmark"
          style={{ color: "rgb(239, 68, 68)", marginRight: "5px" }}
        ></i>{" "}
        {t("save_error")}
      </>
    ),
    "": t("btnUpdate"),
  }[saveStatus];

  return (
    <div className="accueil-container">
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
          maxWidth: "800px",
          margin: "-80px auto 0",
          padding: "0 20px 60px",
        }}
      >
        <div
          className="game-card-modern"
          style={{
            padding: "0",
            cursor: "default",
            overflow: "visible",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "-50px",
            }}
          >
            <img
              src={profileData.avatar}
              alt={t("avatar_alt")}
              style={{
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                border: "4px solid rgba(139, 92, 246, 0.6)",
                boxShadow: "0 0 30px rgba(139, 92, 246, 0.25)",
                objectFit: "cover",
                background: "var(--bg-secondary, #1a1a2e)",
              }}
            />
          </div>

          <div style={{ padding: "16px 30px 30px", textAlign: "center" }}>
            <h2
              className="hero-title"
              style={{ fontSize: "1.8rem", margin: "10px 0 4px" }}
            >
              {profileData.pseudo}
              {profileData.isCertified && (
                <span
                  title={t("certified_profile")}
                  style={{ marginLeft: "10px", fontSize: "1.2rem" }}
                >
                  <i
                    className="fa-solid fa-star"
                    style={{ color: "rgb(255, 212, 59)" }}
                  ></i>
                </span>
              )}
            </h2>

            {profileData.isPrivate && (
              <div style={{ marginBottom: "10px" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    color: "#ef4444",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  <i
                    className="fa-solid fa-lock"
                    style={{ marginRight: "6px" }}
                  ></i>{" "}
                  {t("my_account_private")}
                </span>
              </div>
            )}

            {userAge && (
              <p
                style={{
                  color: "#a78bfa",
                  fontSize: "0.95rem",
                  margin: "0 0 10px 0",
                  fontWeight: "600",
                }}
              >
                {t("age_display", { age: userAge })}
              </p>
            )}

            {profileData.bio ? (
              <p
                className="hero-subtitle"
                style={{
                  fontSize: "0.95rem",
                  fontStyle: "italic",
                  opacity: 0.8,
                }}
              >
                "{profileData.bio}"
              </p>
            ) : (
              <p
                className="hero-subtitle"
                style={{
                  fontSize: "0.9rem",
                  fontStyle: "italic",
                  opacity: 0.5,
                }}
              >
                {t("no_bio")}
              </p>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                margin: "24px 0",
                borderTop: "1px solid rgba(128,128,128,0.1)",
                borderBottom: "1px solid rgba(128,128,128,0.1)",
              }}
            >
              {[
                {
                  label: t("stat_followers"),
                  value: profileData.followersCount,
                },
                {
                  label: t("stat_following"),
                  value: profileData.followingCount,
                },
                { label: t("stat_games"), value: favorites.length },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    flex: 1,
                    padding: "18px 8px",
                    borderRight:
                      i < 2 ? "1px solid rgba(128,128,128,0.1)" : "none",
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

            <button
              className="nav-user-btn"
              onClick={() => setIsEditing(!isEditing)}
              style={{
                minWidth: "220px",
                justifyContent: "center",
                margin: "0 auto",
                padding: "10px 20px",
                fontSize: "0.95rem",
                fontWeight: "600",
                border: "none",
                transition: "all 0.3s ease",
                background: isEditing
                  ? "rgba(128,128,128,0.2)"
                  : "linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)",
                color: isEditing ? "currentColor" : "#ffffff",
                boxShadow: isEditing
                  ? "none"
                  : "0 4px 15px rgba(147, 51, 234, 0.35)",
              }}
            >
              {isEditing ? (
                <>
                  <i
                    className="fa-solid fa-xmark"
                    style={{ marginRight: "5px" }}
                  ></i>{" "}
                  {t("btn_edit_close")}
                </>
              ) : (
                <>
                  <i
                    className="fa-solid fa-pen-to-square"
                    style={{ marginRight: "5px" }}
                  ></i>{" "}
                  {t("btn_edit_open")}
                </>
              )}
            </button>
          </div>
        </div>

        {isEditing && (
          <div
            className="game-card-modern"
            style={{
              padding: "24px",
              marginTop: "24px",
              cursor: "default",
              animation: "slideUp 0.3s ease-out",
            }}
          >
            <h3
              className="section-title"
              style={{ fontSize: "1.3rem", marginBottom: "20px" }}
            >
              {t("edit_profile_title")}
            </h3>

            <div style={{ display: "grid", gap: "20px" }}>
              <div>
                <label
                  className="game-genre"
                  style={{ display: "block", marginBottom: "8px" }}
                >
                  {t("label_avatar")}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="filter-select"
                  style={{ width: "100%", padding: "10px" }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    color: "#c084fc",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  {t("langLabel")}
                </label>
                <select
                  name="lang"
                  value={i18n.language}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    backgroundColor: "#1a1a2e",
                    color: "#ffffff",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    padding: "10px",
                    borderRadius: "6px",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="fr">{t("lang_french")}</option>
                  <option value="en">{t("lang_english")}</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label
                    className="game-genre"
                    style={{ display: "block", marginBottom: "8px" }}
                  >
                    {t("label_pseudo")}
                  </label>
                  <input
                    type="text"
                    name="pseudo"
                    value={profileData.pseudo}
                    onChange={handleChange}
                    className="filter-select"
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label
                    className="game-genre"
                    style={{ display: "block", marginBottom: "8px" }}
                  >
                    {t("label_birthdate")}
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={profileData.birthDate}
                    onChange={handleChange}
                    className="filter-select"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="game-genre"
                  style={{ display: "block", marginBottom: "8px" }}
                >
                  {t("bioLabel")}
                </label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleChange}
                  className="filter-select"
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    paddingTop: "10px",
                  }}
                  placeholder={t("placeholderBio")}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  className="nav-user-btn"
                  onClick={handleUpdate}
                  disabled={saveStatus === "saving"}
                  style={{ justifyContent: "center", padding: "12px" }}
                >
                  {saveLabel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== SECTION COLLECTION  ========== */}
        <div style={{ marginTop: "40px" }}>
          <div className="section-header" style={{ marginBottom: "20px" }}>
            <h2 className="section-title">{t("section_collection")}</h2>
          </div>

          <div className="filters-container" style={{ marginBottom: "30px" }}>
            {FILTERS.map(({ key, status }) => (
              <button
                key={status}
                className={`category-btn ${filter === status ? "active" : ""}`}
                onClick={() => setFilter(status)}
              >
                {t(key)} ({countByStatus[status]})
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
                  ? t("library_empty")
                  : t("library_empty_filter", {
                      filter: t(FILTERS.find((f) => f.status === filter)?.key),
                    })}
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
                      className={`status-select ${game.status}`}
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
                      <option value="to_play">{t("filter_to_play")}</option>
                      <option value="playing">{t("filter_playing")}</option>
                      <option value="finished">{t("filter_finished")}</option>
                      <option value="dropped">{t("filter_dropped")}</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginTop: "40px" }}>
          <CustomLists onGameClick={onGameClick} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Notificationsbell : Composant gérant la récupération périodique et l'affichage des notifications sociales
export const Notificationsbell = ({ user, onUserClick, onGameClick }) => {
  const { t } = useTranslation();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropRef = React.useRef(null);
  const unread = notifs.filter((n) => !n.isRead).length;

  const TYPE_CONFIG = {
    follow: {
      icon: (
        <i
          className="fa-solid fa-user"
          style={{ color: "rgb(148, 163, 184)" }}
        ></i>
      ),
      label: t("notif_follow"),
      color: "#a78bfa",
    },
    like: {
      icon: (
        <i
          className="fa-solid fa-heart"
          style={{ color: "rgb(239, 68, 68)" }}
        ></i>
      ),
      label: t("notif_like"),
      color: "#f87171",
    },
    comment: {
      icon: (
        <i
          className="fa-solid fa-message"
          style={{ color: "rgb(96, 165, 250)" }}
        ></i>
      ),
      label: t("notif_comment"),
      color: "#60a5fa",
    },
    review: {
      icon: (
        <i
          className="fa-solid fa-star"
          style={{ color: "rgb(255, 212, 59)" }}
        ></i>
      ),
      label: t("notif_review"),
      color: "#fbbf24",
    },
    message: {
      icon: (
        <i
          className="fa-solid fa-message"
          style={{ color: "rgb(52, 211, 153)" }}
        ></i>
      ),
      label: t("notif_message"),
      color: "#34d399",
    },
    thread_reply: {
      icon: (
        <i
          className="fa-solid fa-reply"
          style={{ color: "rgb(192, 132, 252)" }}
        ></i>
      ),
      label: t("notif_thread_reply"),
      color: "#c084fc",
    },
  };

  const timeAgo = (ts) => {
    if (!ts) return "";
    const d = ts?._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    const diff = (Date.now() - d) / 1000;
    if (diff < 60) return t("time_just_now");
    if (diff < 3600) return t("time_minutes", { count: Math.floor(diff / 60) });
    if (diff < 86400)
      return t("time_hours", { count: Math.floor(diff / 3600) });
    return t("time_days", { count: Math.floor(diff / 86400) });
  };

  const fetchNotifs = React.useCallback(async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const api = await authAxios();
      const res = await api.get("/notifications");
      setNotifs(res.data?.notifications || []);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user?.uid, fetchNotifs]);

  useEffect(() => {
    const handle = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const markAllRead = async () => {
    try {
      const api = await authAxios();
      await api.patch("/notifications/read-all");
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (_) {}
  };

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      try {
        const api = await authAxios();
        await api.patch(`/notifications/${notif.id}/read`);
      } catch (_) {}
      setNotifs((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
    }
    setOpen(false);
    if (notif.type === "follow" || notif.type === "message")
      onUserClick?.(notif.sourceUserId);
    else if (notif.gameId) onGameClick?.(notif.gameId);
  };

  if (!user) return null;

  return (
    <div ref={dropRef} style={{ position: "relative" }}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) fetchNotifs();
        }}
        className="nav-icon-btn"
        title={t("notifications_title")}
        style={{ position: "relative" }}
      >
        <i className="fa-solid fa-bell" style={{ color: "currentColor" }}></i>
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#9333ea",
              color: "#fff",
              borderRadius: "99px",
              fontSize: "0.65rem",
              fontWeight: "700",
              padding: "1px 5px",
              minWidth: "16px",
              textAlign: "center",
              boxShadow: "0 0 0 2px #0f0f1a",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: "340px",
            maxHeight: "480px",
            background: "var(--bg-secondary, #1a1a2e)",
            border: "1px solid rgba(147,51,234,0.3)",
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            zIndex: 9999,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
              borderBottom: "1px solid rgba(128,128,128,0.2)",
            }}
          >
            <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>
              {t("notifications_title")}{" "}
              {unread > 0 && (
                <span
                  style={{
                    marginLeft: "8px",
                    background: "rgba(147,51,234,0.2)",
                    color: "#c084fc",
                    borderRadius: "99px",
                    fontSize: "0.7rem",
                    padding: "1px 7px",
                  }}
                >
                  {t("notifications_new_count", { count: unread })}
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9333ea",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                }}
              >
                {t("notifications_mark_all_read")}
              </button>
            )}
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading && notifs.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center" }}>
                <div className="loading-spinner" style={{ margin: "0 auto" }} />
              </div>
            ) : notifs.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "2rem",
                    marginBottom: "8px",
                    opacity: 0.5,
                  }}
                >
                  <i className="fa-solid fa-bell-slash"></i>
                </div>
                <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>
                  {t("notifications_empty")}
                </p>
              </div>
            ) : (
              notifs.map((n) => {
                const cfg = TYPE_CONFIG[n.type] || {
                  icon: <i className="fa-solid fa-bell"></i>,
                  label: n.type,
                  color: "#888",
                };
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px 16px",
                      background: n.isRead
                        ? "transparent"
                        : "rgba(147,51,234,0.07)",
                      borderBottom: "1px solid rgba(128,128,128,0.1)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(128,128,128,0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = n.isRead
                        ? "transparent"
                        : "rgba(147,51,234,0.07)")
                    }
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: `${cfg.color}22`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                        flexShrink: 0,
                      }}
                    >
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.82rem",
                          lineHeight: "1.4",
                        }}
                      >
                        <strong style={{ color: cfg.color }}>
                          {n.senderPseudo ||
                            n.sourceUserId ||
                            t("notif_someone")}
                        </strong>{" "}
                        {cfg.label}
                        {n.gameName && (
                          <span style={{ color: "#c084fc" }}>
                            {" "}
                            · {n.gameName}
                          </span>
                        )}
                      </p>
                      {n.message && (
                        <p
                          style={{
                            margin: "3px 0 0",
                            fontSize: "0.75rem",
                            opacity: 0.6,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {n.message}
                        </p>
                      )}
                      <span
                        style={{
                          fontSize: "0.7rem",
                          opacity: 0.5,
                          marginTop: "4px",
                          display: "block",
                        }}
                      >
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    {!n.isRead && (
                      <div
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "#9333ea",
                          flexShrink: 0,
                          marginTop: "5px",
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Utilisateur = (props) => {
  if (props.isPublic) {
    return <PublicProfile {...props} currentUser={props.user} />;
  }
  return <MyProfile {...props} />;
};

export default Utilisateur;
