import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../Service/firebase";
import "../../Style/Styles.css";
import defaultCover from "../assets/fr-default-large_default.jpg"; // Import de l'image par défaut

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

/*
 * Formatte un timestamp Firestore.
 * Après sérialisation JSON, Firestore renvoie { _seconds, _nanoseconds }.
 */
const formatDate = (updatedAt) => {
  if (!updatedAt) return "";
  const ts = updatedAt?._seconds
    ? new Date(updatedAt._seconds * 1000)
    : new Date(updatedAt);
  return ts.toLocaleDateString("fr-FR");
};

/* ════════════════════════════════════════════════ */
const Jeu = ({ gameId, onBack, user, onFavoriteChange, onGameSelect }) => {
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

  // Jeux similaires
  const [similarGames, setSimilarGames] = useState([]);

  /* ── Chargement initial ── */
  useEffect(() => {
    if (!gameId) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);

        // Détails du jeu (IGDB)
        const res = await axios.get(
          `http://localhost:3000/api/games/details/${gameId}`,
        );
        if (res.data) {
          setGame(res.data);
          setSimilarGames(res.data.similar_games || []);
        }

        // Statut collection
        if (auth.currentUser) {
          try {
            const api = await authAxios();
            const resLib = await api.get(`/lists/library/${gameId}`);
            setIsFavorite(resLib.data?.success === true);
          } catch (_) {}
        }

        // Reviews — réponse : { success, averageRating, totalReviews, reviews, nextCursor }
        try {
          const resReviews = await axios.get(
            `http://localhost:3000/api/reviews/game/${gameId}`,
          );
          if (resReviews.data?.success) {
            const allReviews = resReviews.data.reviews || [];
            setReviews(allReviews);
            setAverageRating(resReviews.data.averageRating);

            // Repérer la review du user connecté (id Firestore = userId_gameId)
            if (auth.currentUser) {
              const myId = `${auth.currentUser.uid}_${gameId}`;
              const mine = allReviews.find((r) => r.id === myId);
              if (mine) {
                setMyReview(mine);
                setRating(mine.rating);
                setNewComment(mine.text || "");
              }
            }
          }
        } catch (_) {}
      } catch (err) {
        console.error("Erreur de chargement:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [gameId]);

  /* ── Recharge les reviews après une action ── */
  const refreshReviews = async () => {
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
        }
      }
    } catch (_) {}
  };

  /* ── Favori ── */
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

  /* ── Soumettre / mettre à jour une review ──
   * POST /api/reviews   → body { gameId, rating, text }
   * PUT  /api/reviews/:gameId → body { rating, text }
   */
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

  /* ── Supprimer sa review ── */
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

  /* ── Rendu ── */
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
    return defaultCover; // Retourne l'image par défaut
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
              <div className="game-content">
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

                {/* Note moyenne renvoyée par le controller */}
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

              {/* Formulaire d'avis */}
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

              {/* Liste des avis */}
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
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ══ JEUX SIMILAIRES ══ */}
            {similarGames.length > 0 && (
              <div style={{ marginTop: "3rem" }}>
                <div
                  className="section-header"
                  style={{ marginBottom: "1.5rem" }}
                >
                  <h3 className="section-title">Jeux similaires</h3>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  {similarGames.slice(0, 8).map((sg) => (
                    <div
                      key={sg.id}
                      className="game-card-modern"
                      style={{ cursor: "pointer" }}
                      onClick={() => onGameSelect?.(sg.id)}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jeu;
