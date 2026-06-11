import React, { useState, useEffect } from "react";
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

const GENRES = [
  {
    id: "genre-action",
    name: "Action / Aventure",
    icon: "fa-solid fa-hand-fist",
  },
  { id: "genre-rpg", name: "RPG", icon: "fa-solid fa-dragon" },
  { id: "genre-fps", name: "FPS / Shooter", icon: "fa-solid fa-crosshairs" },
  {
    id: "genre-strategie",
    name: "Stratégie / Gestion",
    icon: "fa-solid fa-chess-knight",
  },
  {
    id: "genre-sport",
    name: "Sport / Course",
    icon: "fa-solid fa-flag-checkered",
  },
  {
    id: "genre-autre",
    name: "Autre (Général)",
    icon: "fa-solid fa-layer-group",
  },
];

const getIconForGenre = (gameId) => {
  const genre = GENRES.find((g) => g.id === String(gameId));
  return genre ? genre.icon : "fa-solid fa-layer-group";
};

/* ── DROPDOWN JEU ── */
const GameDropdown = ({ results, onSelect, searchTerm }) => (
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
      overflowY: "auto",
      maxHeight: "220px",
      overscrollBehavior: "contain",
      boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
    }}
    onWheel={(e) => e.stopPropagation()}
  >
    {!searchTerm &&
      GENRES.map((genre) => (
        <div
          key={genre.id}
          style={{
            padding: "10px 14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderBottom: "1px solid rgba(147,51,234,0.2)",
            background: "rgba(147,51,234,0.05)",
          }}
          onMouseDown={() =>
            onSelect({
              id: genre.id,
              name: genre.name,
              isGenre: true,
              icon: genre.icon,
            })
          }
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(147,51,234,0.18)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(147,51,234,0.05)")
          }
        >
          <div
            style={{
              width: "28px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
            }}
          >
            <i className={genre.icon} style={{ color: "#c4b5fd" }}></i>
          </div>
          <span
            style={{ color: "#c4b5fd", fontSize: "0.9rem", fontWeight: "bold" }}
          >
            Général : {genre.name}
          </span>
        </div>
      ))}
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
            }}
          >
            <i className="fa-solid fa-gamepad" style={{ color: "#c4b5fd" }}></i>
          </div>
        )}
        <span style={{ color: "#e2e8f0", fontSize: "0.9rem" }}>{g.name}</span>
      </div>
    ))}
  </div>
);

/* ── MODALE CRÉATION SUJET ── */
const CreateThreadModal = ({ user, onClose, onCreated }) => {
  const [newThread, setNewThread] = useState({
    title: "",
    content: "",
    gameId: "",
    gameName: "",
    gameCoverId: "",
  });
  const [gameSearch, setGameSearch] = useState("");
  const [gameResults, setGameResults] = useState([]);
  const [showGameSugg, setShowGameSugg] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!gameSearch || gameSearch.length < 2) {
        setGameResults([]);
        setShowGameSugg(false);
        return;
      }
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
    setErrorMsg("");
    if (
      !newThread.title.trim() ||
      !newThread.content.trim() ||
      !newThread.gameId
    ) {
      setErrorMsg(
        "Veuillez remplir le titre, le contenu ET lier un jeu ou genre !",
      );
      return;
    }
    setSubmitting(true);
    try {
      const api = await authAxios();
      await api.post("/forum/threads", {
        title: newThread.title,
        content: newThread.content,
        gameId: newThread.gameId,
        gameName: newThread.gameName,
        gameCoverId: newThread.gameCoverId || null,
        pseudo: user?.pseudo || user?.username,
        avatarUrl: user?.avatar || user?.photoURL,
      });
      onCreated();
      onClose();
    } catch {
      setErrorMsg("Une erreur est survenue lors de la création du sujet.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Overlay */}
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
        className="game-card-modern"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1001,
          width: "90%",
          maxWidth: "560px",
          borderRadius: "20px",
          padding: "28px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          cursor: "default",
          overflow: "visible",
        }}
      >
        {/* En-tête */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3
            className="section-title"
            style={{
              margin: 0,
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <i
              className="fa-solid fa-pen-to-square"
              style={{ color: "currentColor" }}
            ></i>
            Nouveau sujet
          </h3>
          <button
            onClick={onClose}
            className="nav-icon-btn"
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "0",
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Erreur */}
        {errorMsg && (
          <div
            style={{
              color: "#ef4444",
              background: "rgba(239, 68, 68, 0.1)",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "15px",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            <i className="fa-solid fa-circle-xmark"></i> {errorMsg}
          </div>
        )}

        {/* Titre */}
        <input
          className="filter-select"
          placeholder="Titre *"
          value={newThread.title}
          onChange={(e) =>
            setNewThread({ ...newThread, title: e.target.value })
          }
          style={{
            width: "100%",
            marginBottom: "15px",
            boxSizing: "border-box",
          }}
        />

        {/* Contenu */}
        <textarea
          className="filter-select"
          placeholder="Contenu *"
          value={newThread.content}
          onChange={(e) =>
            setNewThread({ ...newThread, content: e.target.value })
          }
          style={{
            width: "100%",
            height: "120px",
            marginBottom: "15px",
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />

        {/* Jeu lié */}
        <label
          className="game-genre"
          style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem" }}
        >
          <i className="fa-solid fa-link" style={{ marginRight: "6px" }}></i>
          Jeu ou Genre lié *
        </label>
        <div style={{ position: "relative" }}>
          {newThread.gameId ? (
            <div
              style={{
                padding: "10px",
                background: "rgba(147,51,234,0.12)",
                border: "1px solid rgba(147,51,234,0.4)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {newThread.gameCoverId ? (
                <img
                  src={`https://images.igdb.com/igdb/image/upload/t_thumb/${newThread.gameCoverId}.jpg`}
                  alt=""
                  style={{
                    width: "24px",
                    height: "30px",
                    borderRadius: "4px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <i
                  className={getIconForGenre(newThread.gameId)}
                  style={{
                    fontSize: "1.2rem",
                    color: "#c084fc",
                    width: "24px",
                    textAlign: "center",
                  }}
                ></i>
              )}
              <span style={{ flex: 1, fontWeight: "600" }}>
                {newThread.gameName}
              </span>
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                }}
                onClick={() =>
                  setNewThread({
                    ...newThread,
                    gameId: "",
                    gameName: "",
                    gameCoverId: "",
                  })
                }
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          ) : (
            <input
              className="filter-select"
              placeholder="Rechercher un jeu ou un genre..."
              value={gameSearch}
              onChange={(e) => {
                setGameSearch(e.target.value);
                setShowGameSugg(true);
              }}
              onFocus={() => setShowGameSugg(true)}
              onBlur={() => setTimeout(() => setShowGameSugg(false), 150)}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          )}
          {showGameSugg && !newThread.gameId && (
            <GameDropdown
              results={gameResults}
              searchTerm={gameSearch}
              onSelect={(g) => {
                setNewThread((prev) => ({
                  ...prev,
                  gameId: String(g.id),
                  gameName: g.name,
                  gameCoverId: g.cover?.image_id || "",
                }));
                setGameSearch(g.name);
                setShowGameSugg(false);
              }}
            />
          )}
        </div>

        {/* Bouton publier */}
        <button
          className="nav-user-btn"
          style={{
            width: "100%",
            marginTop: "24px",
            justifyContent: "center",
            padding: "12px",
          }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <i
                className="fa-solid fa-spinner fa-spin"
                style={{ marginRight: "8px" }}
              ></i>
              Publication en cours...
            </>
          ) : (
            <>
              <i
                className="fa-solid fa-paper-plane"
                style={{ marginRight: "8px" }}
              ></i>
              Publier le sujet
            </>
          )}
        </button>
      </div>
    </>
  );
};

/* ── FORUM PRINCIPAL ── */
const Forum = ({ user, onGameClick, initialThread = null }) => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [newPostContent, setNewPostContent] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false); // ← déclaration ici, dans Forum

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const api = auth.currentUser
        ? await authAxios()
        : axios.create({ baseURL: "http://localhost:3000/api" });
      const res = await api.get("/forum/threads");
      if (res.data.success) setThreads(res.data.threads);
    } catch {
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
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    try {
      const api = await authAxios();
      await api.post("/forum/posts", {
        threadId: selectedThread.id,
        content: newPostContent,
        pseudo: user?.pseudo || user?.username,
        avatarUrl: user?.avatar || user?.photoURL,
      });
      setNewPostContent("");
      fetchThreadDetail(selectedThread);
    } catch {
      alert("Erreur lors de l'envoi de la réponse.");
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  return (
    <div className="accueil-container">
      <div className="main-content-wrapper">
        {/* ── VUE LISTE ── */}
        {view === "list" ? (
          <>
            <div className="section-header">
              <h3>Discussions récentes</h3>
              <button
                className="category-btn active"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCreateModal(true);
                }}
              >
                <i
                  className="fa-solid fa-plus"
                  style={{ marginRight: "6px" }}
                ></i>
                Nouveau sujet
              </button>
            </div>

            <div className="comments-list-modern">
              {loading ? (
                <div style={{ color: "#94a3b8", textAlign: "center" }}>
                  <div
                    className="loading-spinner"
                    style={{ margin: "0 auto" }}
                  ></div>
                </div>
              ) : threads.length === 0 ? (
                <p
                  style={{
                    color: "#94a3b8",
                    textAlign: "center",
                    padding: "40px 0",
                  }}
                >
                  <i
                    className="fa-regular fa-comments"
                    style={{
                      fontSize: "2rem",
                      marginBottom: "10px",
                      display: "block",
                    }}
                  ></i>
                  Aucune discussion pour l'instant.
                </p>
              ) : (
                threads.map((thread) => (
                  <div
                    key={thread.id}
                    className="game-card-modern"
                    style={{
                      padding: "16px 20px",
                      marginBottom: "10px",
                      cursor: "pointer",
                      transition: "border-color 0.2s",
                      display: "flex",
                      gap: "16px",
                      alignItems: "flex-start",
                    }}
                    onClick={() => fetchThreadDetail(thread)}
                  >
                    {/* Cover / icône */}
                    <div style={{ flexShrink: 0 }}>
                      {thread.gameCoverId ? (
                        <img
                          src={`https://images.igdb.com/igdb/image/upload/t_thumb/${thread.gameCoverId}.jpg`}
                          alt="cover"
                          style={{
                            width: "45px",
                            height: "60px",
                            borderRadius: "6px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "45px",
                            height: "60px",
                            borderRadius: "6px",
                            background: "rgba(147,51,234,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.5rem",
                          }}
                        >
                          <i
                            className={
                              String(thread.gameId).startsWith("genre")
                                ? getIconForGenre(thread.gameId)
                                : "fa-solid fa-gamepad"
                            }
                            style={{ color: "#c4b5fd" }}
                          ></i>
                        </div>
                      )}
                    </div>

                    {/* Contenu */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: "0 0 5px 0" }}>{thread.title}</h4>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#94a3b8",
                          margin: "4px 0",
                          fontStyle: "italic",
                          opacity: 0.8,
                        }}
                      >
                        {thread.content.length > 100
                          ? `${thread.content.substring(0, 100)}...`
                          : thread.content}
                      </p>
                      <div
                        style={{
                          marginTop: "6px",
                          fontSize: "0.75rem",
                          color: "#c084fc",
                          background: "rgba(147,51,234,0.12)",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: String(thread.gameId).startsWith("genre")
                            ? "default"
                            : "pointer",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!String(thread.gameId).startsWith("genre"))
                            onGameClick(thread.gameId);
                        }}
                      >
                        <i
                          className={
                            String(thread.gameId).startsWith("genre")
                              ? getIconForGenre(thread.gameId)
                              : "fa-solid fa-gamepad"
                          }
                        ></i>
                        {thread.gameName}
                      </div>
                    </div>

                    {/* Date */}
                    <span
                      className="game-genre"
                      style={{
                        flexShrink: 0,
                        fontSize: "0.75rem",
                        alignSelf: "flex-start",
                      }}
                    >
                      {thread.lastReplyAt?.seconds
                        ? new Date(
                            thread.lastReplyAt.seconds * 1000,
                          ).toLocaleDateString()
                        : "Récemment"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* ── VUE DÉTAIL ── */
          <div className="game-card-modern" style={{ padding: "20px" }}>
            <button className="category-btn" onClick={() => setView("list")}>
              <i
                className="fa-solid fa-arrow-left"
                style={{ marginRight: "6px" }}
              ></i>
              Retour
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                margin: "20px 0",
              }}
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
                {selectedThread.gameName && (
                  <div
                    style={{
                      color: "#c084fc",
                      marginTop: "5px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(147,51,234,0.1)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      cursor: String(selectedThread.gameId).startsWith("genre")
                        ? "default"
                        : "pointer",
                    }}
                    onClick={() =>
                      !String(selectedThread.gameId).startsWith("genre") &&
                      onGameClick(selectedThread.gameId)
                    }
                  >
                    <i
                      className={
                        String(selectedThread.gameId).startsWith("genre")
                          ? getIconForGenre(selectedThread.gameId)
                          : "fa-solid fa-gamepad"
                      }
                    ></i>
                    {selectedThread.gameName}
                  </div>
                )}
              </div>
            </div>

            <p
              style={{
                lineHeight: "1.6",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                paddingBottom: "20px",
              }}
            >
              {selectedThread.content}
            </p>

            <div className="section-header">
              <h4>Réponses</h4>
            </div>

            <div className="comments-list-modern">
              {posts.length === 0 && !loading && (
                <p
                  style={{
                    color: "#64748b",
                    textAlign: "center",
                    padding: "20px 0",
                    fontSize: "0.9rem",
                  }}
                >
                  Aucune réponse pour l'instant. Soyez le premier !
                </p>
              )}
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="post-item"
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                    }}
                  >
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
                        marginTop: "2px",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontWeight: "600",
                          color: "#c084fc",
                          fontSize: "0.9rem",
                          marginBottom: "4px",
                        }}
                      >
                        {post.authorName}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.95rem",
                          color: "inherit",
                          lineHeight: "1.5",
                        }}
                      >
                        {post.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Zone de réponse */}
            {user ? (
              <form onSubmit={handleAddPost} style={{ marginTop: "20px" }}>
                <textarea
                  className="filter-select"
                  style={{
                    width: "100%",
                    height: "80px",
                    marginBottom: "10px",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                  placeholder="Écrire une réponse..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="nav-user-btn"
                  style={{ justifyContent: "center", width: "100%" }}
                  disabled={!newPostContent.trim()}
                >
                  <i
                    className="fa-solid fa-reply"
                    style={{ marginRight: "6px" }}
                  ></i>
                  Répondre
                </button>
              </form>
            ) : (
              <p
                style={{
                  textAlign: "center",
                  color: "#64748b",
                  marginTop: "20px",
                }}
              >
                <i
                  className="fa-solid fa-lock"
                  style={{ marginRight: "6px" }}
                ></i>
                Connectez-vous pour répondre.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Modale création ── */}
      {showCreateModal && (
        <CreateThreadModal
          user={user}
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchThreads}
        />
      )}
    </div>
  );
};

export default Forum;
