import React, { useState, useEffect, useRef } from "react";
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

/* ── Dropdown jeu ── */
const GameDropdown = ({ results, onSelect }) => (
  <div
    style={{
      position: "absolute",
      top: "calc(100% + 6px)",
      left: 0,
      right: 0,
      background: "#0f172a",
      border: "1px solid rgba(147,51,234,0.35)",
      borderRadius: "12px",
      zIndex: 9999,
      overflow: "hidden",
      boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
    }}
  >
    {results.map((g) => (
      <div
        key={g.id}
        style={{
          padding: "10px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
        onMouseDown={() => onSelect(g)}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(147,51,234,0.18)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {g.cover?.image_id ? (
          <img
            src={`https://images.igdb.com/igdb/image/upload/t_thumb/${g.cover.image_id}.jpg`}
            alt=""
            style={{
              width: "28px",
              height: "36px",
              borderRadius: "4px",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: "28px",
              height: "36px",
              borderRadius: "4px",
              background: "rgba(147,51,234,0.2)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
            }}
          >
            🎮
          </div>
        )}
        <span style={{ color: "#e2e8f0", fontSize: "0.9rem" }}>{g.name}</span>
      </div>
    ))}
  </div>
);

/* ── Modale création de sujet ── */
const CreateThreadModal = ({ user, onClose, onCreated }) => {
  const [newThread, setNewThread] = useState({
    title: "",
    content: "",
    gameId: "",
    gameName: "",
  });
  const [gameSearch, setGameSearch] = useState("");
  const [gameResults, setGameResults] = useState([]);
  const [showGameSugg, setShowGameSugg] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!gameSearch || gameSearch.length < 2) {
      setGameResults([]);
      setShowGameSugg(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const api = auth.currentUser
          ? await authAxios()
          : axios.create({ baseURL: "http://localhost:3000/api" });
        const res = await api.get(
          `/games/search?q=${encodeURIComponent(gameSearch)}&limit=6`,
        );
        setGameResults(res.data || []);
        setShowGameSugg(true);
      } catch (_) {}
    }, 350);
    return () => clearTimeout(timer);
  }, [gameSearch]);

  const handleSubmit = async () => {
    if (!newThread.title.trim() || !newThread.content.trim()) return;
    setSubmitting(true);
    try {
      const api = await authAxios();
      const res = await api.post("/forum/threads", {
        title: newThread.title,
        content: newThread.content,
        gameId: newThread.gameId || null,
        pseudo: user?.pseudo || user?.username,
        avatarUrl: user?.avatar || user?.photoURL,
      });
      if (res.data.success) {
        onCreated();
        onClose();
      }
    } catch {
      alert("Erreur lors de la création du sujet.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Fond sombre */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          zIndex: 1000,
          backdropFilter: "blur(4px)",
        }}
      />
      {/* Modale */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1001,
          width: "90%",
          maxWidth: "560px",
          background: "#1a1a2e",
          border: "1px solid rgba(147,51,234,0.35)",
          borderRadius: "20px",
          padding: "28px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ margin: 0, color: "#c4b5fd", fontSize: "1.1rem" }}>
            ✏️ Nouveau sujet
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#fff",
              fontSize: "1.4rem",
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Titre */}
        <label
          style={{
            display: "block",
            fontSize: "0.8rem",
            color: "#94a3b8",
            marginBottom: "6px",
          }}
        >
          Titre du sujet *
        </label>
        <input
          className="filter-select"
          style={{
            width: "100%",
            marginBottom: "16px",
            boxSizing: "border-box",
          }}
          placeholder="Ex: Vos impressions sur God of War ?"
          value={newThread.title}
          onChange={(e) =>
            setNewThread({ ...newThread, title: e.target.value })
          }
        />

        {/* Contenu */}
        <label
          style={{
            display: "block",
            fontSize: "0.8rem",
            color: "#94a3b8",
            marginBottom: "6px",
          }}
        >
          Contenu *
        </label>
        <textarea
          className="filter-select"
          style={{
            width: "100%",
            minHeight: "130px",
            marginBottom: "16px",
            paddingTop: "10px",
            boxSizing: "border-box",
            resize: "vertical",
          }}
          placeholder="Partagez votre avis, posez une question..."
          value={newThread.content}
          onChange={(e) =>
            setNewThread({ ...newThread, content: e.target.value })
          }
        />

        {/* Lier un jeu */}
        <label
          style={{
            display: "block",
            fontSize: "0.8rem",
            color: "#94a3b8",
            marginBottom: "6px",
          }}
        >
          🎮 Lier à un jeu <span style={{ opacity: 0.5 }}>(optionnel)</span>
        </label>

        {/* Jeu sélectionné */}
        {newThread.gameId ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              marginBottom: "16px",
              background: "rgba(147,51,234,0.12)",
              border: "1px solid rgba(147,51,234,0.4)",
              borderRadius: "10px",
            }}
          >
            <span style={{ fontSize: "0.9rem", color: "#c084fc", flex: 1 }}>
              ✓ {newThread.gameName}
            </span>
            <button
              onClick={() => {
                setNewThread({ ...newThread, gameId: "", gameName: "" });
                setGameSearch("");
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                fontSize: "1rem",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <input
              className="filter-select"
              style={{ width: "100%", boxSizing: "border-box" }}
              placeholder="Rechercher un jeu..."
              value={gameSearch}
              onChange={(e) => {
                setGameSearch(e.target.value);
              }}
              onBlur={() => setTimeout(() => setShowGameSugg(false), 150)}
              onFocus={() => gameResults.length > 0 && setShowGameSugg(true)}
            />
            {showGameSugg && gameResults.length > 0 && (
              <GameDropdown
                results={gameResults}
                onSelect={(g) => {
                  setNewThread({
                    ...newThread,
                    gameId: String(g.id),
                    gameName: g.name,
                  });
                  setGameSearch(g.name);
                  setShowGameSugg(false);
                }}
              />
            )}
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button
            className="nav-user-btn"
            style={{
              flex: 1,
              justifyContent: "center",
              opacity:
                submitting ||
                !newThread.title.trim() ||
                !newThread.content.trim()
                  ? 0.5
                  : 1,
            }}
            onClick={handleSubmit}
            disabled={
              submitting || !newThread.title.trim() || !newThread.content.trim()
            }
          >
            {submitting ? "Publication..." : "Publier"}
          </button>
          <button
            className="category-btn"
            style={{ borderColor: "#ef4444", color: "#f87171" }}
            onClick={onClose}
          >
            Annuler
          </button>
        </div>
      </div>
    </>
  );
};

/* ── Forum principal ── */
const Forum = ({ user, onGameClick, initialThread = null }) => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [gameFilter, setGameFilter] = useState("");
  const [gameIdFilter, setGameIdFilter] = useState("");
  const [gameSearchResults, setGameSearchResults] = useState([]);
  const [searchingGames, setSearchingGames] = useState(false);
  const [showGameSuggestions, setShowGameSuggestions] = useState(false);

  const [newPostContent, setNewPostContent] = useState("");

  useEffect(() => {
    if (!initialThread) {
      fetchThreads();
    } else if (initialThread.thread) {
      fetchThreadDetail(initialThread.thread);
    } else if (initialThread.gameId) {
      setGameFilter(initialThread.gameName || "");
      setGameIdFilter(initialThread.gameId);
      fetchThreads(initialThread.gameId);
    }
  }, [initialThread]);

  useEffect(() => {
    if (!gameFilter || gameFilter.length < 2) {
      setGameSearchResults([]);
      setShowGameSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingGames(true);
      try {
        const api = auth.currentUser
          ? await authAxios()
          : axios.create({ baseURL: "http://localhost:3000/api" });
        const res = await api.get(
          `/games/search?q=${encodeURIComponent(gameFilter)}&limit=5`,
        );
        setGameSearchResults(res.data || []);
        setShowGameSuggestions(true);
      } catch (_) {
        setGameSearchResults([]);
      } finally {
        setSearchingGames(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [gameFilter]);

  const fetchThreads = async (gameId = gameIdFilter) => {
    setLoading(true);
    try {
      const api = auth.currentUser
        ? await authAxios()
        : axios.create({ baseURL: "http://localhost:3000/api" });
      const url = gameId ? `/forum/threads?gameId=${gameId}` : "/forum/threads";
      const res = await api.get(url);
      if (res.data.success) setThreads(res.data.threads);
    } catch (err) {
      console.error("Erreur fetchThreads:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchThreadDetail = async (thread) => {
    setLoading(true);
    setSelectedThread(thread);
    try {
      const api = auth.currentUser
        ? await authAxios()
        : axios.create({ baseURL: "http://localhost:3000/api" });
      const res = await api.get(`/forum/threads/${thread.id}/posts`);
      if (res.data.success) {
        setPosts(res.data.posts);
        setView("detail");
      }
    } catch (err) {
      console.error("Erreur fetchThreadDetail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    try {
      const api = await authAxios();
      const res = await api.post("/forum/posts", {
        threadId: selectedThread.id,
        content: newPostContent,
        pseudo: user?.pseudo || user?.username,
        avatarUrl: user?.avatar || user?.photoURL,
      });
      if (res.data.success) {
        setNewPostContent("");
        fetchThreadDetail(selectedThread);
      }
    } catch {
      alert("Erreur lors de l'ajout de la réponse.");
    }
  };

  const selectGameFilter = (game) => {
    setGameFilter(game.name);
    setGameIdFilter(String(game.id));
    setShowGameSuggestions(false);
    fetchThreads(String(game.id));
  };

  const clearGameFilter = () => {
    setGameFilter("");
    setGameIdFilter("");
    setShowGameSuggestions(false);
    fetchThreads("");
  };

  if (loading && view === "list") {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="accueil-container">
      {/* Modale création */}
      {showCreateModal && (
        <CreateThreadModal
          user={user}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => fetchThreads()}
        />
      )}

      <div className="hero-section" style={{ minHeight: "150px" }}>
        <div className="hero-gradient" />
        <div className="hero-content">
          <h2 className="hero-title">Forum Communautaire</h2>
          <p className="hero-subtitle">
            Discutez de vos jeux préférés avec la communauté.
          </p>
        </div>
      </div>

      <div className="main-content-wrapper">
        {view === "list" ? (
          <>
            <div className="section-header" style={{ marginBottom: "20px" }}>
              <h3 className="section-title">Discussions récentes</h3>
              {user && (
                <button
                  className="category-btn active"
                  onClick={() => setShowCreateModal(true)}
                >
                  + Nouveau sujet
                </button>
              )}
            </div>

            {/* Filtre par jeu */}
            <div
              style={{ marginBottom: "20px", position: "relative", zIndex: 10 }}
            >
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    className="filter-select"
                    style={{
                      width: "100%",
                      paddingLeft: "12px",
                      boxSizing: "border-box",
                    }}
                    placeholder="🔍 Filtrer par jeu..."
                    value={gameFilter}
                    onChange={(e) => {
                      setGameFilter(e.target.value);
                      if (!e.target.value) clearGameFilter();
                    }}
                    onFocus={() =>
                      gameSearchResults.length > 0 &&
                      setShowGameSuggestions(true)
                    }
                    onBlur={() =>
                      setTimeout(() => setShowGameSuggestions(false), 150)
                    }
                  />
                  {searchingGames && (
                    <span
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "0.75rem",
                        color: "#6b7280",
                      }}
                    >
                      …
                    </span>
                  )}
                  {showGameSuggestions && gameSearchResults.length > 0 && (
                    <GameDropdown
                      results={gameSearchResults}
                      onSelect={selectGameFilter}
                    />
                  )}
                </div>
                {gameIdFilter && (
                  <button
                    className="category-btn"
                    onClick={clearGameFilter}
                    style={{
                      whiteSpace: "nowrap",
                      borderColor: "#ef4444",
                      color: "#f87171",
                    }}
                  >
                    ✕ Effacer
                  </button>
                )}
              </div>
              {gameIdFilter && (
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#9333ea",
                    marginTop: "6px",
                  }}
                >
                  💬 Fils liés à <strong>{gameFilter}</strong>
                </p>
              )}
            </div>

            {/* Liste des fils */}
            <div className="comments-list-modern">
              {threads.length === 0 && (
                <p
                  style={{
                    color: "#6b7280",
                    textAlign: "center",
                    padding: "2rem 0",
                  }}
                >
                  {gameIdFilter
                    ? "Aucun fil de discussion pour ce jeu."
                    : "Aucun sujet pour le moment."}
                </p>
              )}
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className="game-card-modern"
                  style={{
                    padding: "16px 20px",
                    marginBottom: "10px",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onClick={() => fetchThreadDetail(thread)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "rgba(147,51,234,0.5)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        style={{
                          margin: "0 0 5px 0",
                          color: "#fff",
                          fontSize: "0.95rem",
                        }}
                      >
                        {thread.title}
                      </h4>
                      <p
                        style={{
                          fontSize: "0.82rem",
                          color: "#94a3b8",
                          margin: 0,
                        }}
                      >
                        Par{" "}
                        <strong style={{ color: "#c084fc" }}>
                          {thread.authorName}
                        </strong>
                        {" · "}
                        {thread.replyCount} réponse
                        {thread.replyCount !== 1 ? "s" : ""}
                      </p>
                      {thread.gameId && (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: "6px",
                            fontSize: "0.72rem",
                            color: "#c084fc",
                            background: "rgba(147,51,234,0.12)",
                            borderRadius: "6px",
                            padding: "2px 8px",
                            border: "1px solid rgba(147,51,234,0.2)",
                          }}
                        >
                          🎮 Jeu lié
                        </span>
                      )}
                    </div>
                    <span
                      className="game-genre"
                      style={{ flexShrink: 0, fontSize: "0.75rem" }}
                    >
                      {thread.lastReplyAt?.seconds
                        ? new Date(
                            thread.lastReplyAt.seconds * 1000,
                          ).toLocaleDateString()
                        : "Récemment"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              className="category-btn"
              onClick={() => {
                setView("list");
                fetchThreads();
              }}
              style={{ marginBottom: "20px" }}
            >
              ← Retour à la liste
            </button>

            <div
              className="game-card-modern"
              style={{
                padding: "20px",
                marginBottom: "30px",
                borderLeft: "4px solid #9333ea",
                cursor: "default",
              }}
            >
              <div
                style={{ display: "flex", gap: "15px", marginBottom: "15px" }}
              >
                <img
                  src={
                    selectedThread.authorAvatarUrl ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedThread.authorName}`
                  }
                  alt=""
                  style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                />
                <div>
                  <h3 style={{ margin: 0 }}>{selectedThread.title}</h3>
                  <span style={{ fontSize: "0.8rem", color: "#9333ea" }}>
                    Par {selectedThread.authorName}
                  </span>
                  {selectedThread.gameId && onGameClick && (
                    <button
                      className="category-btn"
                      style={{
                        marginLeft: "12px",
                        padding: "2px 10px",
                        fontSize: "0.75rem",
                        borderColor: "#c084fc",
                        color: "#c084fc",
                      }}
                      onClick={() => onGameClick(selectedThread.gameId)}
                    >
                      🎮 Voir le jeu
                    </button>
                  )}
                </div>
              </div>
              <p style={{ color: "#e2e8f0", lineHeight: "1.6" }}>
                {selectedThread.content}
              </p>
            </div>

            <div className="section-header">
              <h4 className="section-title">Réponses</h4>
              <span className="section-count">{posts.length}</span>
            </div>

            <div
              className="comments-list-modern"
              style={{ marginBottom: "30px" }}
            >
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="game-card-modern"
                  style={{
                    padding: "15px",
                    marginBottom: "10px",
                    background: "rgba(255,255,255,0.02)",
                    cursor: "default",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px" }}>
                    <img
                      src={
                        post.authorAvatarUrl ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${post.authorName}`
                      }
                      alt=""
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "5px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#c084fc",
                          }}
                        >
                          {post.authorName}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {post.createdAt?.seconds
                            ? new Date(
                                post.createdAt.seconds * 1000,
                              ).toLocaleString()
                            : "Maintenant"}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.9rem",
                          color: "#cbd5e1",
                        }}
                      >
                        {post.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {user ? (
              <form
                className="game-card-modern"
                style={{ padding: "20px", cursor: "default" }}
                onSubmit={handleAddPost}
              >
                <textarea
                  className="filter-select"
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    marginBottom: "10px",
                    paddingTop: "10px",
                    boxSizing: "border-box",
                  }}
                  placeholder="Votre réponse..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="nav-user-btn"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Répondre
                </button>
              </form>
            ) : (
              <p style={{ textAlign: "center", color: "#64748b" }}>
                Connectez-vous pour participer à la discussion.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Forum;
