import React, { useState, useEffect, useRef } from "react";
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

/* ── Composant étoiles réutilisable ── */
const StarRating = ({
  value,
  hoverValue,
  onChange,
  onHover,
  onLeave,
  readOnly = false,
}) => (
  <div style={{ display: "flex", gap: "4px" }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        style={{
          fontSize: readOnly ? "1rem" : "1.5rem",
          cursor: readOnly ? "default" : "pointer",
          color: (hoverValue || value) >= star ? "#c084fc" : "#334155",
          transition: "color 0.15s ease",
        }}
        onClick={() => !readOnly && onChange?.(star)}
        onMouseEnter={() => !readOnly && onHover?.(star)}
        onMouseLeave={() => !readOnly && onLeave?.()}
      >
        ★
      </span>
    ))}
  </div>
);

const formatDate = (updatedAt) => {
  if (!updatedAt) return "";
  const ts = updatedAt?._seconds
    ? new Date(updatedAt._seconds * 1000)
    : new Date(updatedAt);
  return ts.toLocaleDateString("fr-FR");
};

/* ════════════════════════════════════════════════ */
const Jeu = ({
  gameId,
  onBack,
  user,
  onFavoriteChange,
  onGameClick,
  onForumClick,
}) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Formulaire
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const [commentingReviewId, setCommentingReviewId] = useState(null);
  const [reviewCommentText, setReviewCommentText] = useState("");

  // Jeux similaires
  const [similarGames, setSimilarGames] = useState([]);

  // Fil de discussion du jeu sur le forum
  const [gameThread, setGameThread] = useState(null);

  const scrollSimilar = (direction) => {
    setSimilarGames((prev) => {
      if (prev.length <= 5) return prev;
      const newArr = [...prev];
      if (direction === "right") {
        const first = newArr.shift();
        newArr.push(first);
      } else {
        const last = newArr.pop();
        newArr.unshift(last);
      }
      return newArr;
    });
  };

  /* ── Chargement initial ── */
  useEffect(() => {
    if (!gameId) return;

    setReviews([]);
    setAverageRating(null);
    setGameThread(null);
    window.scrollTo(0, 0);

    const fetchDetails = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `http://localhost:3000/api/games/details/${gameId}`,
        );
        if (res.data) {
          setGame(res.data);
        }

        // Jeux similaires
        try {
          const api = auth.currentUser
            ? await authAxios()
            : axios.create({ baseURL: "http://localhost:3000/api" });
          const resSimilar = await api.get(`/games/${gameId}/similar`);
          setSimilarGames(resSimilar.data || []);
        } catch (errSimilar) {
          console.warn("Impossible de charger les jeux similaires", errSimilar);
        }

        // Statut collection
        if (auth.currentUser) {
          try {
            const api = await authAxios();
            const resLib = await api.get(`/lists/library/${gameId}`);
            setIsFavorite(resLib.data?.success === true);
          } catch (_) {}
        }

        // Fil de discussion lié au jeu
        try {
          const api = auth.currentUser
            ? await authAxios()
            : axios.create({ baseURL: "http://localhost:3000/api" });
          const resThreads = await api.get(`/forum/threads?gameId=${gameId}`);
          if (resThreads.data?.success && resThreads.data.threads.length > 0) {
            setGameThread(resThreads.data.threads[0]); // Premier fil lié au jeu
          } else {
            setGameThread(false);
          }
        } catch (_) {
          setGameThread(false);
        }
      } catch (err) {
        console.error("Erreur de chargement:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [gameId]);

  // Rafraîchissement des avis
  useEffect(() => {
    if (!gameId) return;
    refreshReviews(true);
    const interval = setInterval(() => refreshReviews(false), 10000);
    return () => clearInterval(interval);
  }, [gameId]);

  const refreshReviews = async (isInitial = false) => {
    try {
      const resReviews = await axios.get(
        `http://localhost:3000/api/reviews/game/${gameId}`,
      );
      if (resReviews.data?.success) {
        const allReviews = resReviews.data.reviews || [];
        setReviews(allReviews);
        setAverageRating(resReviews.data.averageRating);

        if (auth.currentUser) {
          const myId = `${auth.currentUser.uid}_${gameId}`;
          const mine = allReviews.find((r) => r.id === myId);
          setMyReview(mine || null);

          if (isInitial && mine) {
            setRating(mine.rating);
            setNewComment(mine.text || "");
          }
        }
      }
    } catch (_) {}
  };

  /* ── Ouvrir le forum (fil existant ou liste filtrée sur le jeu) ── */
  const handleForumButtonClick = () => {
    if (gameThread) {
      onForumClick?.({ thread: gameThread });
    } else {
      onForumClick?.({ gameId: String(gameId), gameName: game.name });
    }
  };

  const toggleFavorite = async () => {
    if (!auth.currentUser) {
      alert("Connectez-vous pour ajouter un favori.");
      return;
    }
    setFavLoading(true);
    try {
      const api = await authAxios();
      if (isFavorite) {
        await api.delete(`/lists/library/${gameId}`);
        setIsFavorite(false);
        onFavoriteChange?.();
      } else {
        const gameCover = game?.cover?.image_id
          ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
          : "";
        await api.post(`/lists/status`, {
          gameId: String(gameId),
          status: "to_play",
          gameName: game.name,
          gameCover,
        });
        setIsFavorite(true);
        onFavoriteChange?.();
      }
    } catch (err) {
      console.error("Erreur favoris:", err.response?.data);
      alert("Erreur lors de la mise à jour des favoris.");
    } finally {
      setFavLoading(false);
    }
  };

  const handleSaveReview = async () => {
    if (!auth.currentUser) {
      alert("Connectez-vous pour laisser un avis.");
      return;
    }
    if (rating === 0) {
      alert("Veuillez choisir une note.");
      return;
    }
    setReviewLoading(true);
    try {
      const api = await authAxios();
      if (myReview) {
        await api.put(`/reviews/${gameId}`, {
          rating,
          text: newComment,
          pseudo:
            user?.pseudo ||
            user?.displayName ||
            auth.currentUser?.displayName ||
            "Anonyme",
        });
      } else {
        await api.post(`/reviews`, {
          gameId: String(gameId),
          rating,
          text: newComment,
          pseudo:
            user?.pseudo ||
            user?.displayName ||
            auth.currentUser?.displayName ||
            "Anonyme",
        });
      }
      await refreshReviews();
      setShowCommentBox(false);
    } catch (err) {
      console.error("Erreur review:", err.response?.data);
      alert("Erreur lors de l'envoi de votre avis.");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm("Supprimer votre avis ?")) return;
    setReviewLoading(true);
    try {
      const api = await authAxios();
      await api.delete(`/reviews/${gameId}`);
      await refreshReviews();
      setRating(0);
      setNewComment("");
      setShowCommentBox(false);
    } catch (err) {
      console.error("Erreur suppression:", err.response?.data);
      alert("Erreur lors de la suppression.");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleLikeReview = async (reviewId) => {
    if (!auth.currentUser) {
      alert("Connectez-vous pour aimer un avis.");
      return;
    }
    try {
      const api = await authAxios();
      const res = await api.post(`/interactions/reviews/${reviewId}/like`);
      if (res.data.success) {
        setReviews((prev) =>
          prev.map((r) => {
            if (r.id === reviewId) {
              const myUid = auth.currentUser.uid;
              const likedBy = r.likedBy || [];
              const isNowLiked = !likedBy.includes(myUid);
              return {
                ...r,
                likedBy: isNowLiked
                  ? [...likedBy, myUid]
                  : likedBy.filter((id) => id !== myUid),
              };
            }
            return r;
          }),
        );
      }
    } catch (err) {
      console.error("Erreur like review:", err);
    }
  };

  const handleSendComment = async (reviewId) => {
    if (!auth.currentUser) {
      alert("Connectez-vous pour commenter.");
      return;
    }
    if (!reviewCommentText.trim()) return;

    try {
      const api = await authAxios();
      const res = await api.post(`/interactions/reviews/${reviewId}/comments`, {
        text: reviewCommentText,
      });
      if (res.data.success) {
        setReviewCommentText("");
        setCommentingReviewId(null);
        alert("Commentaire envoyé !");
        refreshReviews();
      }
    } catch (err) {
      console.error("Erreur comment review:", err);
    }
  };

  if (loading)
    return (
      <div className="app-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );

  const getCoverUrl = (coverObj) => {
    if (coverObj && coverObj.image_id) {
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${coverObj.image_id}.jpg`;
    }
    return defaultCover;
  };

  return (
    <div className="app-container">
      <div className="hero-gradient"></div>

      <div className="main-content-wrapper">
        <button
          onClick={onBack}
          className="category-btn"
          style={{
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ← Retour à la navigation
        </button>

        <div className="game-details-layout">
          {/* ── COLONNE GAUCHE ── */}
          <div className="game-sidebar-modern">
            <div className="game-card-modern" style={{ cursor: "default" }}>
              <div className="game-image-container">
                <img
                  src={getCoverUrl(game.cover)}
                  alt={game.name}
                  className="game-image"
                />
                <div className="rating-badge">
                  <span className="rating-star">⭐</span>
                  <span className="rating-value">
                    {(game.total_rating / 20).toFixed(1)}
                  </span>
                </div>
              </div>
              <div
                className="game-content"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <button
                  onClick={toggleFavorite}
                  disabled={favLoading}
                  className={`nav-user-btn ${isFavorite ? "" : "category-btn"}`}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    background: isFavorite ? "#ef4444" : "",
                    opacity: favLoading ? 0.7 : 1,
                    cursor: favLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {favLoading
                    ? "..."
                    : isFavorite
                      ? "❤️ Dans la collection"
                      : "🤍 Ajouter aux favoris"}
                </button>

                {/* ── BOUTON FIL DE DISCUSSION ── toujours visible */}
                <button
                  onClick={handleForumButtonClick}
                  className="category-btn"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderColor: "#9333ea",
                    color: "#c084fc",
                  }}
                >
                  💬{" "}
                  {gameThread
                    ? "Voir le fil de discussion"
                    : "Ouvrir une discussion"}
                  {gameThread?.replyCount > 0 && (
                    <span
                      style={{
                        background: "#9333ea",
                        color: "#fff",
                        borderRadius: "99px",
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        padding: "1px 7px",
                      }}
                    >
                      {gameThread.replyCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="filters-section" style={{ marginTop: "1.5rem" }}>
              <h4
                className="game-genre"
                style={{
                  display: "block",
                  marginBottom: "1rem",
                  textAlign: "center",
                }}
              >
                Informations
              </h4>
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: "0.9rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <p>
                  <strong>Genres :</strong>{" "}
                  {game.genres?.map((g) => g.name).join(", ")}
                </p>
                <p>
                  <strong>Plateformes :</strong>{" "}
                  {game.platforms?.map((p) => p.name).join(", ")}
                </p>
              </div>
            </div>
          </div>

          {/* ── COLONNE DROITE ── */}
          <div className="game-main-info">
            <h1 className="hero-title">{game.name}</h1>

            <div className="section-header">
              <h3 className="section-title">Résumé</h3>
            </div>
            <p
              className="hero-subtitle"
              style={{ color: "#e2e8f0", marginBottom: "3rem" }}
            >
              {game.summary || "Aucun résumé disponible."}
            </p>

            {/* ══ SECTION AVIS ══ */}
            <div className="comments-section-modern">
              <div className="section-header">
                <h3 className="section-title">Avis des joueurs</h3>

                {averageRating && (
                  <span
                    className="section-count"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    ⭐ {averageRating} / 5
                    <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                      ({reviews.length})
                    </span>
                  </span>
                )}

                {auth.currentUser && (
                  <button
                    className="category-btn active sort-btn"
                    onClick={() => {
                      if (!showCommentBox && myReview) {
                        setRating(myReview.rating);
                        setNewComment(myReview.text || "");
                      }
                      setShowCommentBox((v) => !v);
                    }}
                  >
                    {showCommentBox
                      ? "Annuler"
                      : myReview
                        ? "Modifier mon avis"
                        : "Noter le jeu"}
                  </button>
                )}
              </div>

              {showCommentBox && (
                <div
                  className="game-card-modern"
                  style={{
                    padding: "1.5rem",
                    marginBottom: "2rem",
                    cursor: "default",
                  }}
                >
                  <p
                    style={{
                      color: "#9ca3af",
                      marginBottom: "0.75rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Votre note
                  </p>
                  <div style={{ marginBottom: "1rem" }}>
                    <StarRating
                      value={rating}
                      hoverValue={hoverRating}
                      onChange={setRating}
                      onHover={setHoverRating}
                      onLeave={() => setHoverRating(0)}
                    />
                  </div>
                  <textarea
                    className="filter-select"
                    style={{
                      width: "100%",
                      minHeight: "100px",
                      marginBottom: "1rem",
                      paddingTop: "10px",
                      resize: "vertical",
                    }}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Partagez votre expérience sur ce titre... (optionnel)"
                  />
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button
                      onClick={handleSaveReview}
                      disabled={reviewLoading || rating === 0}
                      className="nav-user-btn"
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        opacity: reviewLoading || rating === 0 ? 0.5 : 1,
                        cursor:
                          reviewLoading || rating === 0
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {reviewLoading
                        ? "Envoi..."
                        : myReview
                          ? "Mettre à jour"
                          : "Publier mon avis"}
                    </button>
                    {myReview && (
                      <button
                        onClick={handleDeleteReview}
                        disabled={reviewLoading}
                        className="category-btn"
                        style={{
                          background: "#ef4444",
                          borderColor: "#ef4444",
                          color: "#fff",
                        }}
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="comments-list-modern">
                {reviews.length === 0 && (
                  <p
                    style={{
                      color: "#6b7280",
                      textAlign: "center",
                      padding: "2rem 0",
                    }}
                  >
                    Aucun avis pour le moment. Soyez le premier !
                  </p>
                )}
                {reviews.map((r) => {
                  const isMe =
                    auth.currentUser &&
                    r.id === `${auth.currentUser.uid}_${gameId}`;
                  return (
                    <div
                      key={r.id}
                      className="game-card-modern"
                      style={{
                        padding: "1rem",
                        marginBottom: "1rem",
                        background: isMe
                          ? "rgba(147,51,234,0.08)"
                          : "rgba(255,255,255,0.02)",
                        border: isMe
                          ? "1px solid rgba(147,51,234,0.3)"
                          : undefined,
                        cursor: "default",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <StarRating value={r.rating} readOnly />
                        <span className="game-year">
                          {formatDate(r.updatedAt)}
                        </span>
                      </div>
                      {r.text && (
                        <p style={{ margin: "0.5rem 0", color: "#cbd5e1" }}>
                          {r.text}
                        </p>
                      )}
                      <div
                        className="game-title"
                        style={{ fontSize: "0.85rem", color: "#9333ea" }}
                      >
                        — {r.pseudo || r.userId}
                        {isMe && (
                          <span
                            style={{
                              marginLeft: "8px",
                              color: "#6b7280",
                              fontSize: "0.75rem",
                            }}
                          >
                            (vous)
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          marginTop: "12px",
                          borderTop: "1px solid rgba(255,255,255,0.05)",
                          paddingTop: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                        }}
                      >
                        <button
                          onClick={() => handleLikeReview(r.id)}
                          className="nav-icon-btn"
                          style={{
                            padding: "4px 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            color: r.likedBy?.includes(auth.currentUser?.uid)
                              ? "#f87171"
                              : "#94a3b8",
                            background: r.likedBy?.includes(
                              auth.currentUser?.uid,
                            )
                              ? "rgba(248,113,113,0.1)"
                              : "transparent",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                          }}
                        >
                          {r.likedBy?.includes(auth.currentUser?.uid)
                            ? "❤️"
                            : "🤍"}
                          <span>{r.likedBy?.length || 0}</span>
                        </button>

                        <button
                          onClick={() =>
                            setCommentingReviewId(
                              commentingReviewId === r.id ? null : r.id,
                            )
                          }
                          className="nav-icon-btn"
                          style={{
                            padding: "4px 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            color: "#94a3b8",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                          }}
                        >
                          ✍️ Répondre
                        </button>
                      </div>

                      {r.comments && r.comments.length > 0 && (
                        <div
                          style={{
                            marginTop: "12px",
                            marginLeft: "10px",
                            paddingLeft: "12px",
                            borderLeft: "2px solid rgba(147, 51, 234, 0.3)",
                          }}
                        >
                          {r.comments.map((c, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: "rgba(255, 255, 255, 0.03)",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                marginBottom: "6px",
                                fontSize: "0.82rem",
                              }}
                            >
                              <p
                                style={{
                                  margin: "0 0 4px 0",
                                  color: "#cbd5e1",
                                  lineHeight: "1.4",
                                }}
                              >
                                {c.text}
                              </p>
                              <span
                                style={{
                                  color: "#9333ea",
                                  fontSize: "0.75rem",
                                  fontWeight: "600",
                                }}
                              >
                                {c.pseudo || "Anonyme"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {commentingReviewId === r.id && (
                        <div style={{ marginTop: "12px" }}>
                          <textarea
                            className="filter-select"
                            style={{
                              width: "100%",
                              minHeight: "60px",
                              fontSize: "0.85rem",
                              padding: "8px",
                              resize: "vertical",
                            }}
                            value={reviewCommentText}
                            onChange={(e) =>
                              setReviewCommentText(e.target.value)
                            }
                            placeholder="Écrire une réponse..."
                          />
                          <button
                            className="nav-user-btn"
                            style={{
                              marginTop: "8px",
                              padding: "5px 15px",
                              fontSize: "0.8rem",
                            }}
                            onClick={() => handleSendComment(r.id)}
                          >
                            Envoyer
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ══ JEUX SIMILAIRES ══ */}
            {similarGames.length > 0 && (
              <div style={{ marginTop: "3rem" }}>
                <h3
                  className="section-title"
                  style={{ marginBottom: "1.5rem" }}
                >
                  Jeux similaires
                </h3>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={() => scrollSimilar("left")}
                    className="slider-nav-btn left"
                    title="Précédent"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>

                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      overflow: "hidden",
                      width: "calc((160px * 5) + (1rem * 4))",
                      margin: "0 auto",
                      padding: "10px 0",
                    }}
                  >
                    {similarGames.map((sg) => (
                      <div
                        key={sg.id}
                        className="game-card-modern"
                        style={{ cursor: "pointer", flex: "0 0 160px" }}
                        onClick={() => onGameClick?.(sg.id)}
                      >
                        <div className="game-image-container">
                          <img
                            src={getCoverUrl(sg.cover)}
                            alt={sg.name}
                            className="game-image"
                          />
                        </div>
                        <div
                          className="game-content"
                          style={{ padding: "0.5rem" }}
                        >
                          <p
                            className="game-title"
                            style={{
                              fontSize: "0.8rem",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {sg.name}
                          </p>
                          {sg.total_rating && (
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "#9ca3af",
                                margin: 0,
                              }}
                            >
                              ⭐ {(sg.total_rating / 20).toFixed(1)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => scrollSimilar("right")}
                    className="slider-nav-btn right"
                    title="Suivant"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jeu;
