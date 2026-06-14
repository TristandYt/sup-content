import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { auth } from "@monorepo-frontend/shared";
import "../../Style/Styles.css";
import defaultCover from "../assets/fr-default-large_default.jpg";

const authAxios = async () => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  const token = await firebaseUser.getIdToken(true);
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
  const [customLists, setCustomLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);

  const myId = String(currentUser?.uid || currentUser?.id || "");
  const isMe = myId !== "" && myId === String(targetUserId);

  const fetchAll = async () => {
    if (!targetUserId) return;
    setLoading(true);
    setError("");
    try {
      const api = await authAxios();

      if (!api) {
        setError("Veuillez vous connecter pour voir ce profil.");
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
          console.error(err);
          customListsReq = await api.get(`/lists/custom?userId=${targetUserId}`);
        } catch (err2) {
          console.error(err2);
          customListsReq = { data: { lists: [] } };
        }
      }

      const [
        profileRes,
        libraryRes,
        followingRes,
        followersRes,
      ] = await Promise.all([
        profileReq,
        libraryReq,
        followingReq,
        followersReq,
      ]);

      const data = profileRes.data;
      const userData = data?.user || data;
      const lib = libraryRes.data?.library || [];

      setProfile({
        username: userData.username || userData.pseudo || "Utilisateur",
        bio: userData.bio || "",
        website: userData.website || "",
        avatar: userData.avatar || userData.photoURL || null,
        followersCount: userData.followersCount || 0,
        followingCount: userData.followingCount || 0,
        gamesCount: lib.length,
        isCertified: userData.isCertified || false,
        isPrivate: userData.isPrivate || false,
      });

      setLibrary(lib);
      setCustomLists((customListsReq.data?.lists || []).filter((l) => !l.isPrivate));

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
      setError("Impossible de charger ce profil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [targetUserId]);

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
      alert(err.response?.data?.msg || "Impossible d'ouvrir la conversation.");
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

  const statusMapping = {
    to_play: "⏳ À faire",
    playing: "🎮 En cours",
    finished: "✅ Fini",
    dropped: "❌ Abandonné",
  };

  if (loading) {
    return (
        <div className="accueil-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div className="loading-spinner" />
          <p className="loading-text" style={{ marginTop: "16px" }}>Chargement du profil…</p>
        </div>
    );
  }

  if (error || !profile) {
    return (
        <div className="accueil-container" style={{ textAlign: "center", paddingTop: "80px" }}>
          <div className="empty-icon">😕</div>
          <h3 className="empty-title">Profil introuvable</h3>
          <p className="empty-text">{error}</p>
          <button className="category-btn" onClick={onBack} style={{ marginTop: "20px" }}>← Retour</button>
        </div>
    );
  }

  return (
      <div className="accueil-container">
        <div style={{ position: "relative", zIndex: 10, padding: "20px 20px 0" }}>
          <button className="category-btn" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            ← Retour
          </button>
        </div>

        <div className="hero-section" style={{ minHeight: "160px", background: "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(59,130,246,0.1) 100%)" }}>
          <div className="hero-gradient" />
        </div>

        <div style={{ maxWidth: "640px", margin: "-80px auto 0", padding: "0 20px 60px" }}>
          <div className="game-card-modern" style={{ padding: "0", cursor: "default", overflow: "visible" }}>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "-50px" }}>
              <img
                  src={profile.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`}
                  alt={profile.username}
                  style={{ width: "100px", height: "100px", borderRadius: "50%", border: "4px solid rgba(139, 92, 246, 0.6)", boxShadow: "0 0 30px rgba(139, 92, 246, 0.25)", objectFit: "cover", background: "#1a1a2e" }}
              />
            </div>

            <div style={{ padding: "16px 30px 30px", textAlign: "center" }}>
              <h2 className="hero-title" style={{ fontSize: "1.8rem", margin: "10px 0 8px" }}>
                {profile.username}
                {profile.isCertified && (
                    <span title="Profil certifié" style={{ marginLeft: "10px", fontSize: "1.2rem", color: "#60a5fa", verticalAlign: "middle" }}>⭐</span>
                )}
              </h2>

              <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                {isMutual && <span style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", color: "#4ade80", borderRadius: "20px", padding: "3px 12px", fontSize: "0.75rem", fontWeight: "600" }}>✓ Abonnement mutuel</span>}
                {!isMutual && theyFollowMe && <span style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.35)", color: "#60a5fa", borderRadius: "20px", padding: "3px 12px", fontSize: "0.75rem" }}>Vous suit</span>}
                {iFollow && !theyFollowMe && <span style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.35)", color: "#a78bfa", borderRadius: "20px", padding: "3px 12px", fontSize: "0.75rem" }}>Abonné</span>}
              </div>

              {profile.bio && <p className="hero-subtitle" style={{ fontSize: "0.9rem", fontStyle: "italic", opacity: 0.65 }}>"{profile.bio}"</p>}

              <div style={{ display: "flex", justifyContent: "center", margin: "24px 0", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {[
                  { label: "Abonnés", value: profile.followersCount },
                  { label: "Abonnements", value: profile.followingCount },
                ].map((stat, i) => (
                    <div key={stat.label} style={{ flex: 1, padding: "18px 8px", borderRight: i < 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                      <p className="hero-title" style={{ fontSize: "1.4rem", margin: "0 0 4px", fontWeight: "700" }}>{stat.value}</p>
                      <p className="game-genre" style={{ margin: 0, fontSize: "0.75rem", opacity: 0.6 }}>{stat.label}</p>
                    </div>
                ))}
              </div>

              {currentUser && !isMe ? (
                  <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                    <button className="nav-user-btn" onClick={handleFollow} disabled={followLoading} style={{ minWidth: "150px", justifyContent: "center", opacity: followLoading ? 0.6 : 1, ...(iFollow ? { borderColor: "rgba(239,68,68,0.5)", color: "#f87171" } : {}) }}>
                      {followLoading ? "…" : iFollow ? "✗ Se désabonner" : "✚ Suivre"}
                    </button>
                    {isMutual && (
                        <button className="nav-user-btn" onClick={handleMessage} disabled={msgLoading} style={{ minWidth: "150px", justifyContent: "center", opacity: msgLoading ? 0.6 : 1, background: "rgba(139,92,246,0.2)", borderColor: "rgba(139,92,246,0.5)" }}>
                          {msgLoading ? "…" : "💬 Envoyer un message"}
                        </button>
                    )}
                  </div>
              ) : null}
            </div>
          </div>

          {/* ── Collection publique ── */}
          {profile.isPrivate && !isMutual ? (
              /* ── VUE COMPTE PRIVÉ ── */
              <div className="game-card-modern" style={{ marginTop: "40px", padding: "60px 20px", textAlign: "center", cursor: "default" }}>
                <div style={{ fontSize: "3.5rem", marginBottom: "16px", opacity: 0.8 }}>🔒</div>
                <h3 className="section-title" style={{ fontSize: "1.5rem", marginBottom: "8px", justifyContent: "center", border: "none" }}>
                  Ce compte est privé
                </h3>
                <p className="hero-subtitle" style={{ fontSize: "0.95rem", margin: 0, opacity: 0.7 }}>
                  Abonnez-vous mutuellement pour découvrir sa collection et ses listes.
                </p>
              </div>
          ) : (
              <>
                {/* ── Collection publique ── */}
                <div style={{ marginTop: "40px" }}>
                  <div className="section-header" style={{ marginBottom: "20px" }}>
                    <h3 className="section-title">Sa Collection</h3>
                  </div>
                  {library.length === 0 ? (
                      <p className="empty-text" style={{ textAlign: "center", padding: "20px" }}>Cet utilisateur n'a pas encore ajouté de jeux.</p>
                  ) : (
                      <div className="game-grid">
                        {library.map((game) => (
                            <div key={game.gameId} className="game-card-modern" style={{ cursor: "pointer" }} onClick={() => onGameClick && onGameClick(game.gameId)}>
                              <div className="game-image-container">
                                <img src={getCoverUrl(game.gameCover || game.cover)} alt={game.gameName || game.name} className="game-image" />
                              </div>
                              <div className="game-content">
                                <h4 className="game-title">{game.gameName || game.name}</h4>
                                <span className="game-genre" style={{ fontSize: "0.7rem", opacity: 0.8 }}>{statusMapping[game.status] || "Prévu"}</span>
                              </div>
                            </div>
                        ))}
                      </div>
                  )}
                </div>

                {/* ── Listes personnalisées publiques ── */}
                {customLists.length > 0 && (
                    <div style={{ marginTop: "40px" }}>
                      <div className="section-header" style={{ marginBottom: "20px" }}>
                        <h3 className="section-title">Ses Listes</h3>
                        <span className="section-count">{customLists.length}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {customLists.map((list) => {
                          const isOpen = activeListId === list.id;

                          return (
                              <div key={list.id} className="game-card-modern" style={{ padding: "0", cursor: "default", position: "relative", zIndex: isOpen ? 50 : 1 }}>
                                <div onClick={() => setActiveListId(isOpen ? null : list.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", cursor: "pointer" }}>
                                  <div>
                                    <h4 className="game-title" style={{ margin: 0 }}>{list.name}</h4>
                                    {list.description && <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: "4px 0 0" }}>{list.description}</p>}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span className="section-count" style={{ fontSize: "0.75rem" }}>{(list.games || []).length} jeux</span>
                                    <span style={{ color: "#9333ea", fontSize: "1.2rem" }}>{isOpen ? "▾" : "▸"}</span>
                                  </div>
                                </div>

                                {isOpen ? (
                                    <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                      {(list.games || []).length === 0 ? (
                                          <p style={{ fontSize: "0.85rem", color: "#64748b", paddingTop: "16px", textAlign: "center" }}>Cette liste est vide.</p>
                                      ) : (
                                          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", paddingTop: "16px" }}>
                                            {(list.games || []).map((g) => (
                                                <div key={g.gameId} onClick={() => onGameClick && onGameClick(g.gameId)} style={{ width: "70px", cursor: "pointer" }}>
                                                  <img src={getCoverUrl(g.gameCover)} alt={g.gameName} style={{ width: "70px", height: "90px", borderRadius: "8px", objectFit: "cover" }} />
                                                  <p style={{ fontSize: "0.65rem", color: "#94a3b8", margin: "6px 0 0", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {g.gameName}
                                                  </p>
                                                </div>
                                            ))}
                                          </div>
                                      )}
                                    </div>
                                ) : (
                                    <div style={{ padding: "0 20px 20px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                      {(list.games || []).slice(0, 5).map((g) => (
                                          <div key={g.gameId} onClick={() => onGameClick && onGameClick(g.gameId)} style={{ width: "50px", height: "65px", borderRadius: "6px", overflow: "hidden", cursor: "pointer", flexShrink: 0 }}>
                                            <img src={getCoverUrl(g.gameCover)} alt={g.gameName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                          </div>
                                      ))}
                                      {(list.games || []).length > 5 && (
                                          <div style={{ width: "50px", height: "65px", borderRadius: "6px", background: "rgba(147,51,234,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "#c084fc", fontWeight: "600" }}>
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
      </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CUSTOM LISTS — sous-composant de MyProfile
═══════════════════════════════════════════════════════════ */
const CustomLists = ({ onGameClick }) => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", isPrivate: false });
  const [saving, setSaving] = useState(false);
  const [gameSearch, setGameSearch] = useState("");
  const [gameResults, setGameResults] = useState([]);
  const [searchingGames, setSearchingGames] = useState(false);
  const [activeListId, setActiveListId] = useState(null);

  useEffect(() => {
    if (!gameSearch || gameSearch.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGameResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchingGames(true);
      try {
        const api = await authAxios();
        const res = await api.get(`/games/search?q=${encodeURIComponent(gameSearch)}&limit=6`);
        setGameResults(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setSearchingGames(false);
      }
    }, 350);
    return () => clearTimeout(t);
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLists();
    }, []);

  const handleSaveList = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      const api = await authAxios();
      if (editingList) {
        await api.put(`/lists/custom/${editingList.id}`, formData);
        setLists((prev) => prev.map((l) => l.id === editingList.id ? { ...l, ...formData } : l));
      } else {
        const res = await api.post("/lists/custom", formData);
        setLists((prev) => [...prev, { id: res.data.listId, ...formData, games: [] }]);
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

  const handleDeleteList = async (id) => {
    if (!window.confirm("Supprimer cette liste ?")) return;
    try {
      const api = await authAxios();
      await api.delete(`/lists/custom/${id}`);
      setLists((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {console.error(err)}
  };

  const handleAddGame = async (list, game) => {
    try {
      const api = await authAxios();
      const gameEntry = {
        gameId: String(game.id),
        gameName: game.name,
        gameCover: game.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg` : "",
      };
      await api.post(`/lists/custom/${list.id}/games`, gameEntry);
      setLists((prev) => prev.map((l) => l.id === list.id ? { ...l, games: [...(l.games || []), gameEntry] } : l));
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
      setLists((prev) => prev.map((l) => l.id === listId ? { ...l, games: (l.games || []).filter((g) => g.gameId !== gameId) } : l));
    } catch (err) {console.error("Erreur removeGame:", err);}
  };

  const openEdit = (list) => {
    setEditingList(list);
    setFormData({ name: list.name, description: list.description || "", isPrivate: list.isPrivate || false });
    setShowForm(true);
  };

  const getCoverUrl = (cover) => {
    if (!cover) return defaultCover;
    if (typeof cover === "string" && cover.startsWith("http")) return cover;
    if (cover.image_id) return `https://images.igdb.com/igdb/image/upload/t_cover_big/${cover.image_id}.jpg`;
    return defaultCover;
  };

  return (
      <div>
        <div className="section-header" style={{ marginBottom: "20px" }}>
          <h2 className="section-title">Mes Listes</h2>
          <button className="category-btn active" onClick={() => { setShowForm(!showForm); setEditingList(null); setFormData({ name: "", description: "", isPrivate: false }); }}>
            {showForm && !editingList ? "Annuler" : "+ Nouvelle liste"}
          </button>
        </div>

        {showForm && (
            <div className="game-card-modern" style={{ padding: "20px", marginBottom: "24px", cursor: "default" }}>
              <h4 className="game-title" style={{ marginBottom: "16px" }}>{editingList ? "Modifier la liste" : "Créer une liste"}</h4>
              <input className="filter-select" style={{ width: "100%", marginBottom: "10px" }} placeholder="Nom de la liste (ex: Horreur, RPG indés…)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <textarea className="filter-select" style={{ width: "100%", minHeight: "70px", marginBottom: "10px", paddingTop: "10px" }} placeholder="Description (optionnel)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <input type="checkbox" id="isPrivate" checked={formData.isPrivate} onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })} style={{ accentColor: "#9333ea" }} />
                <label htmlFor="isPrivate" className="game-genre" style={{ cursor: "pointer", margin: 0 }}>🔒 Liste privée (visible uniquement par moi)</label>
              </div>
              <button className="nav-user-btn" style={{ width: "100%", justifyContent: "center", opacity: saving ? 0.6 : 1 }} onClick={handleSaveList} disabled={saving}>
                {saving ? "Sauvegarde..." : editingList ? "Mettre à jour" : "Créer la liste"}
              </button>
            </div>
        )}

        {loading ? (
            <div className="loading-container"><div className="loading-spinner" /></div>
        ) : lists.length === 0 ? (
            <div className="game-card-modern" style={{ padding: "40px", textAlign: "center", cursor: "default" }}>
              <p style={{ fontSize: "2rem", marginBottom: "12px" }}>📋</p>
              <p className="hero-subtitle">Aucune liste pour l'instant.</p>
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
                          zIndex: isOpen ? 9999 : 1
                        }}
                    >
                      <div onClick={() => setActiveListId(isOpen ? null : list.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", cursor: "pointer" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h4 className="game-title" style={{ margin: 0, fontSize: "1rem" }}>{list.name}</h4>
                            {list.isPrivate && <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>🔒</span>}
                            <span className="section-count" style={{ fontSize: "0.72rem" }}>{(list.games || []).length} jeux</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0, marginLeft: "12px" }}>
                          <button className="category-btn" style={{ padding: "4px 10px", fontSize: "0.75rem" }} onClick={(e) => { e.stopPropagation(); openEdit(list); }}>✏️</button>
                          <button className="category-btn" style={{ padding: "4px 10px", fontSize: "0.75rem", borderColor: "#ef4444", color: "#f87171" }} onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}>🗑️</button>
                          <span style={{ color: "#9333ea", fontSize: "1.2rem" }}>{isOpen ? "▾" : "▸"}</span>
                        </div>
                      </div>

                      {isOpen && (
                          <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            {(list.games || []).length === 0 ? (
                                <p style={{ fontSize: "0.85rem", color: "#64748b", padding: "16px 0 8px", textAlign: "center" }}>Aucun jeu dans cette liste. Recherche ci-dessous pour en ajouter.</p>
                            ) : (
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", padding: "16px 0 12px" }}>
                                  {(list.games || []).map((g) => (
                                      <div key={g.gameId} style={{ position: "relative", width: "70px" }}>
                                        <div onClick={() => onGameClick && onGameClick(g.gameId)} style={{ width: "70px", height: "90px", borderRadius: "8px", overflow: "hidden", cursor: "pointer" }}>
                                          <img src={getCoverUrl(g.gameCover)} alt={g.gameName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        </div>
                                        <button onClick={() => handleRemoveGame(list.id, g.gameId)} style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", border: "none", borderRadius: "50%", width: "18px", height: "18px", cursor: "pointer", color: "#fff", fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>✕</button>
                                        <p style={{ fontSize: "0.65rem", color: "#94a3b8", margin: "4px 0 0", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.gameName}</p>
                                      </div>
                                  ))}
                                </div>
                            )}

                            <div style={{ position: "relative", marginTop: "8px" }}>
                              <input className="filter-select" style={{ width: "100%" }} placeholder="🔍 Ajouter un jeu à cette liste…" value={gameSearch} onChange={(e) => setGameSearch(e.target.value)} onBlur={() => setTimeout(() => setGameResults([]), 200)} />
                              {searchingGames && <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "0.75rem" }}>…</span>}
                              {gameResults.length > 0 && (
                                  <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#1e293b", border: "1px solid rgba(147,51,234,0.3)", borderRadius: "10px", zIndex: 99999, pointerEvents: "auto", overflow: "hidden", boxShadow: "0 15px 40px rgba(0,0,0,0.8)" }}>
                                    {gameResults.map((g) => (
                                        <div key={g.id} onMouseDown={() => handleAddGame(list, g)} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(147,51,234,0.15)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                          {g.cover?.image_id && <img src={`https://images.igdb.com/igdb/image/upload/t_thumb/${g.cover.image_id}.jpg`} alt="" style={{ width: "28px", height: "36px", borderRadius: "4px", objectFit: "cover" }} />}
                                          <span style={{ color: "#e2e8f0", fontSize: "0.9rem" }}>{g.name}</span>
                                          {(list.games || []).some((lg) => String(lg.gameId) === String(g.id)) && <span style={{ marginLeft: "auto", color: "#4ade80", fontSize: "0.75rem" }}>✓ Ajouté</span>}
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
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    uid: user?.uid || user?.id || "",
    pseudo: user?.username || user?.pseudo || user?.displayName || "Joueur",
    email: user?.email || "",
    bio: user?.bio || "",
    website: user?.profileData?.website || "",
    role: user?.role || "",
    birthDate: user?.birthDate || "",
    followersCount: 0,
    followingCount: 0,
    preferences: user?.preferences || {
      notifications: true,
      privateProfile: false,
      theme: "dark",
      showAdultGames: false
    },
    avatar:
        user?.avatar ||
        user?.photoURL ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || user?.pseudo || user?.displayName || "Joueur"}`,
  });

  const [favorites, setFavorites] = useState([]);
  const [filter, setFilter] = useState("Tous");
  const [saveStatus, setSaveStatus] = useState("");

  const fetchMyFullProfile = async () => {
    try {
      const api = await authAxios();
      if (!api) return;

      const profileReq = api.get("/users/profile");
      const followingReq = api.get("/follows/me/following").catch(() => ({ data: { following: [] } }));
      const followersReq = api.get("/follows/me/followers").catch(() => ({ data: { followers: [] } }));

      const [res, followingRes, followersRes] = await Promise.all([profileReq, followingReq, followersReq]);

      if (res.data.success && res.data.user) {
        const u = res.data.user;

        const actualFollowersCount = followersRes.data?.followers?.length || u.followersCount || 0;
        const actualFollowingCount = followingRes.data?.following?.length || u.followingCount || 0;

        const fullProfile = {
          uid: u.uid || u.userId || profileData.uid,
          ...profileData,
          pseudo: u.username || u.pseudo || profileData.pseudo,
          bio: u.bio || profileData.bio,
          website: u.profileData?.website || "",
          avatar: u.avatar || u.photoURL || profileData.avatar,
          role: u.role || "",
          birthDate: u.birthDate || "",
          isCertified: u.isCertified || false,
          followersCount: actualFollowersCount,
          followingCount: actualFollowingCount,
          preferences: u.preferences || profileData.preferences,
        };
        setProfileData(fullProfile);
        if (onLoginSuccess) onLoginSuccess(fullProfile);
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

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMyFullProfile();
      fetchLibrary();
    }
  }, [user?.uid]);

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

      await api.put("/users/profile", {
        username: profileData.pseudo || profileData.username,
        bio: profileData.bio,
        website: profileData.website,
        avatarUrl: profileData.avatar,
        birthDate: profileData.birthDate,
        preferences: profileData.preferences,
      });

      if (onLoginSuccess) onLoginSuccess(profileData);
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus("");
        setIsEditing(false);
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

  const handlePreferenceChange = (key, value) => {
    setProfileData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value },
    }));
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
    if (cover.image_id) return `https://images.igdb.com/igdb/image/upload/t_cover_big/${cover.image_id}.jpg`;
    if (typeof cover === "string" && cover.startsWith("http")) return cover;
    return defaultCover;
  };

  const saveLabel = {
    saving: "Sauvegarde...",
    saved: "✅ Sauvegardé !",
    error: "❌ Erreur",
    "": "Sauvegarder les modifications",
  }[saveStatus];

  return (
      <div className="accueil-container">
        <div className="hero-section" style={{ minHeight: "160px", background: "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(59,130,246,0.1) 100%)" }}>
          <div className="hero-gradient" />
        </div>

        <div style={{ maxWidth: "800px", margin: "-80px auto 0", padding: "0 20px 60px" }}>
          <div className="game-card-modern" style={{ padding: "0", cursor: "default", overflow: "visible", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "-50px" }}>
              <img src={profileData.avatar} alt="Avatar" style={{ width: "110px", height: "110px", borderRadius: "50%", border: "4px solid rgba(139, 92, 246, 0.6)", boxShadow: "0 0 30px rgba(139, 92, 246, 0.25)", objectFit: "cover", background: "#1a1a2e" }} />
            </div>

            <div style={{ padding: "16px 30px 30px", textAlign: "center" }}>
              <h2 className="hero-title" style={{ fontSize: "1.8rem", margin: "10px 0 4px" }}>
                {profileData.pseudo}
                {profileData.isCertified && <span title="Profil certifié" style={{ marginLeft: "10px", fontSize: "1.2rem", color: "#60a5fa" }}>⭐</span>}
              </h2>

              {userAge && <p style={{ color: "#a78bfa", fontSize: "0.95rem", margin: "0 0 10px 0", fontWeight: "600" }}>{userAge} ans</p>}

              {profileData.bio ? (
                  <p className="hero-subtitle" style={{ fontSize: "0.95rem", fontStyle: "italic", opacity: 0.8 }}>"{profileData.bio}"</p>
              ) : (
                  <p className="hero-subtitle" style={{ fontSize: "0.9rem", fontStyle: "italic", opacity: 0.5 }}>Aucune bio renseignée.</p>
              )}

              <div style={{ display: "flex", justifyContent: "center", margin: "24px 0", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {[
                  { label: "Abonnés", value: profileData.followersCount },
                  { label: "Abonnements", value: profileData.followingCount },
                  { label: "Jeux Favoris", value: favorites.length }
                ].map((stat, i) => (
                    <div key={stat.label} style={{ flex: 1, padding: "18px 8px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                      <p className="hero-title" style={{ fontSize: "1.4rem", margin: "0 0 4px", fontWeight: "700" }}>{stat.value}</p>
                      <p className="game-genre" style={{ margin: 0, fontSize: "0.75rem", opacity: 0.6 }}>{stat.label}</p>
                    </div>
                ))}
              </div>

              <button className="nav-user-btn" onClick={() => setIsEditing(!isEditing)} style={{ minWidth: "220px", justifyContent: "center", margin: "0 auto", background: isEditing ? "rgba(255,255,255,0.1)" : "" }}>
                {isEditing ? "❌ Fermer l'édition" : "✏️ Éditer le profil"}
              </button>
            </div>
          </div>

          {isEditing && (
              <div className="game-card-modern" style={{ padding: "24px", marginTop: "24px", cursor: "default", animation: "slideUp 0.3s ease-out" }}>
                <h3 className="section-title" style={{ fontSize: "1.3rem", marginBottom: "20px" }}>Modifier les informations</h3>

                <div style={{ display: "grid", gap: "20px" }}>
                  <div>
                    <label className="game-genre" style={{ display: "block", marginBottom: "8px" }}>Photo de profil (Avatar)</label>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="filter-select" style={{ width: "100%", padding: "10px" }} />
                  </div>

                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <label className="game-genre" style={{ display: "block", marginBottom: "8px" }}>Pseudo</label>
                      <input type="text" name="pseudo" value={profileData.pseudo} onChange={handleChange} className="filter-select" style={{ width: "100%" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <label className="game-genre" style={{ display: "block", marginBottom: "8px" }}>Date de naissance</label>
                      <input type="date" name="birthDate" value={profileData.birthDate} onChange={handleChange} className="filter-select" style={{ width: "100%" }} />
                    </div>
                  </div>

                  <div>
                    <label className="game-genre" style={{ display: "block", marginBottom: "8px" }}>Bio</label>
                    <textarea name="bio" value={profileData.bio} onChange={handleChange} className="filter-select" style={{ width: "100%", minHeight: "80px", paddingTop: "10px" }} placeholder="Parle un peu de toi..." />
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "10px" }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#c4b5fd" }}>⚙️ Paramètres</h4>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div><p style={{ margin: 0, fontSize: "0.9rem", color: "#e2e8f0" }}>Afficher les jeux +18</p></div>
                      <div onClick={() => handlePreferenceChange("showAdultGames", !profileData.preferences?.showAdultGames)} style={{ width: "42px", height: "24px", borderRadius: "99px", cursor: "pointer", background: profileData.preferences?.showAdultGames ? "#9333ea" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s" }}>
                        <div style={{ position: "absolute", top: "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", left: profileData.preferences?.showAdultGames ? "21px" : "3px" }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
                      <div><p style={{ margin: 0, fontSize: "0.9rem", color: "#e2e8f0" }}>Profil Privé</p></div>
                      <div onClick={() => handlePreferenceChange("privateProfile", !profileData.preferences?.privateProfile)} style={{ width: "42px", height: "24px", borderRadius: "99px", cursor: "pointer", background: profileData.preferences?.privateProfile ? "#9333ea" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s" }}>
                        <div style={{ position: "absolute", top: "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", left: profileData.preferences?.privateProfile ? "21px" : "3px" }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                    <button className="nav-user-btn" onClick={handleUpdate} disabled={saveStatus === "saving"} style={{ justifyContent: "center", padding: "12px" }}>
                      {saveLabel}
                    </button>
                    {profileData.role === "admin" && (
                        <button className="nav-user-btn" onClick={onAdminClick} style={{ justifyContent: "center", background: "rgba(167,139,250,0.2)", borderColor: "#a78bfa" }}>
                          🛡️ Dashboard Admin
                        </button>
                    )}
                    <button className="category-btn" onClick={onLogout} style={{ justifyContent: "center", borderColor: "#ef4444", color: "#ef4444", marginTop: "10px" }}>
                      {t("btnLogout")}
                    </button>
                  </div>

                </div>
              </div>
          )}

          <div style={{ marginTop: "40px" }}>
            <div className="section-header" style={{ marginBottom: "20px" }}>
              <h2 className="section-title">Ma Collection</h2>
              <span className="section-count">{favorites.length}</span>
            </div>

            <div className="filters-container" style={{ marginBottom: "30px" }}>
              {["Tous", "A faire", "En cours", "Fini", "Abandonné"].map((s) => (
                  <button key={s} className={`category-btn ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>{s}</button>
              ))}
            </div>

            {filteredGames.length === 0 ? (
                <div className="game-card-modern" style={{ padding: "40px", textAlign: "center", cursor: "default" }}>
                  <p className="hero-subtitle">
                    {favorites.length === 0 ? "Ta bibliothèque est vide. Ajoute des jeux pour les voir ici !" : `Aucun jeu dans la catégorie "${filter}"`}
                  </p>
                </div>
            ) : (
                <div className="game-grid">
                  {filteredGames.map((game) => (
                      <div key={game.gameId} className="game-card-modern" onClick={() => onGameClick && onGameClick(game.gameId)}>
                        <div className="game-image-container">
                          <img src={getCoverUrl(game.gameCover || game.cover)} alt={game.gameName || game.name} className="game-image" />
                        </div>
                        <div className="game-content">
                          <h4 className="game-title">{game.gameName || game.name}</h4>
                          <select className={`status-select ${statusMapping[game.status]?.toLowerCase().replace(" ", "-") || ""}`} value={game.status || "to_play"} onClick={(e) => e.stopPropagation()} onChange={(e) => handleStatusUpdate(game.gameId, e.target.value, game.gameName || game.name, game.gameCover || game.cover)}>
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

          <div style={{ marginTop: "40px" }}>
            <CustomLists onGameClick={onGameClick} />
          </div>

        </div>
      </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   NOTIFICATIONS
═══════════════════════════════════════════════════════════ */
export const Notificationsbell = ({ user, onUserClick, onGameClick }) => {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropRef = React.useRef(null);
  const unread = notifs.filter((n) => !n.isRead).length;

  const TYPE_CONFIG = {
    follow: { icon: "👤", label: "vous suit", color: "#a78bfa" },
    like: { icon: "❤️", label: "a aimé votre avis", color: "#f87171" },
    comment: { icon: "💬", label: "a commenté", color: "#60a5fa" },
    review: { icon: "⭐", label: "a noté le jeu", color: "#fbbf24" },
    message: { icon: "✉️", label: "vous a écrit", color: "#34d399" },
    thread_reply: { icon: "🗨️", label: "a répondu au fil", color: "#c084fc" },
  };

  const timeAgo = (ts) => {
    if (!ts) return "";
    const d = ts?._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    // eslint-disable-next-line react-hooks/purity
    const diff = (Date.now() - d) / 1000;
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    return `${Math.floor(diff / 86400)} j`;
  };

  const fetchNotifs = React.useCallback(async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const api = await authAxios();
      const res = await api.get("/notifications");
      setNotifs(res.data?.notifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    } catch (e) {console.error(e)}
  };

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      try {
        const api = await authAxios();
        await api.patch(`/notifications/${notif.id}/read`);
      } catch (e) {console.error(e)}
      setNotifs((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
    }
    setOpen(false);
    if (notif.type === "follow" || notif.type === "message") onUserClick?.(notif.sourceUserId);
    else if (notif.gameId) onGameClick?.(notif.gameId);
  };

  if (!user) return null;

  return (
      <div ref={dropRef} style={{ position: "relative" }}>
        <button onClick={() => { setOpen((v) => !v); if (!open) fetchNotifs(); }} className="nav-icon-btn" title="Notifications" style={{ position: "relative" }}>
          🔔
          {unread > 0 && (
              <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#9333ea", color: "#fff", borderRadius: "99px", fontSize: "0.65rem", fontWeight: "700", padding: "1px 5px", minWidth: "16px", textAlign: "center", boxShadow: "0 0 0 2px #0f0f1a" }}>
            {unread > 9 ? "9+" : unread}
          </span>
          )}
        </button>

        {open && (
            <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: "340px", maxHeight: "480px", background: "#1a1a2e", border: "1px solid rgba(147,51,234,0.3)", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 9999, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontWeight: "600", fontSize: "0.95rem", color: "#e2e8f0" }}>Notifications {unread > 0 && <span style={{ marginLeft: "8px", background: "rgba(147,51,234,0.2)", color: "#c084fc", borderRadius: "99px", fontSize: "0.7rem", padding: "1px 7px" }}>{unread} nouvelles</span>}</span>
                {unread > 0 && <button onClick={markAllRead} style={{ background: "none", border: "none", cursor: "pointer", color: "#9333ea", fontSize: "0.75rem", fontWeight: "600" }}>Tout marquer lu</button>}
              </div>
              <div style={{ overflowY: "auto", flex: 1 }}>
                {loading && notifs.length === 0 ? (
                    <div style={{ padding: "30px", textAlign: "center" }}><div className="loading-spinner" style={{ margin: "0 auto" }} /></div>
                ) : notifs.length === 0 ? (
                    <div style={{ padding: "40px 20px", textAlign: "center" }}><div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔕</div><p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" }}>Aucune notification pour le moment</p></div>
                ) : (
                    notifs.map((n) => {
                      const cfg = TYPE_CONFIG[n.type] || { icon: "📣", label: n.type, color: "#888" };
                      return (
                          <div key={n.id} onClick={() => handleClick(n)} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 16px", background: n.isRead ? "transparent" : "rgba(147,51,234,0.07)", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")} onMouseLeave={(e) => (e.currentTarget.style.background = n.isRead ? "transparent" : "rgba(147,51,234,0.07)")}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `${cfg.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>{cfg.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: "0.82rem", color: "#cbd5e1", lineHeight: "1.4" }}><strong style={{ color: cfg.color }}>{n.senderPseudo || n.sourceUserId || "Quelqu'un"}</strong> {cfg.label}{n.gameName && <span style={{ color: "#c084fc" }}> · {n.gameName}</span>}</p>
                              {n.message && <p style={{ margin: "3px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</p>}
                              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", marginTop: "4px", display: "block" }}>{timeAgo(n.createdAt)}</span>
                            </div>
                            {!n.isRead && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#9333ea", flexShrink: 0, marginTop: "5px" }} />}
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