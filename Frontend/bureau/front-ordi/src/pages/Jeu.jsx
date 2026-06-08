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

const translateToFr = async (text) => {
  if (!text) return "";
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    return text;
  } catch (_) {
    return text;
  }
};

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

const formatReleaseDate = (timestamp) => {
  if (!timestamp) return "Date inconnue";
  return new Date(timestamp * 1000).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
  const { i18n } = useTranslation();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const [translatedSummary, setTranslatedSummary] = useState("");
  const [translating, setTranslating] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const [commentingReviewId, setCommentingReviewId] = useState(null);
  const [reviewCommentText, setReviewCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [similarGames, setSimilarGames] = useState([]);

  const [dlcs, setDlcs] = useState([]);
  const [expansions, setExpansions] = useState([]);
  const [dlcLoading, setDlcLoading] = useState(false);
  const [dlcChecked, setDlcChecked] = useState(false);
  const [dlcTab, setDlcTab] = useState("dlc");

  const [gameThread, setGameThread] = useState(null);

  const scrollSimilar = (direction) => {
    setSimilarGames((prev) => {
      if (prev.length <= 5) return prev;
      const arr = [...prev];
      if (direction === "right") {
        const f = arr.shift();
        arr.push(f);
      } else {
        const l = arr.pop();
        arr.unshift(l);
      }
      return arr;
    });
  };

  useEffect(() => {
    if (!game?.summary) return;
    setTranslatedSummary("");

    if (i18n.language === "fr") {
      setTranslating(true);
      translateToFr(game.summary).then((result) => {
        setTranslatedSummary(result);
        setTranslating(false);
      });
    }
  }, [game, i18n.language]);

  useEffect(() => {
    if (!gameId) return;
    setReviews([]);
    setAverageRating(null);
    setGameThread(null);
    setCommentingReviewId(null);
    setReviewCommentText("");
    setDlcs([]);
    setExpansions([]);
    setDlcChecked(false);
    setTranslatedSummary("");
    window.scrollTo(0, 0);

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:3000/api/games/details/${gameId}`,
        );
        if (res.data) {
          const g = res.data;
          setGame(g);
          if (g.dlcs?.length) setDlcs(g.dlcs);
          if (g.expansions?.length) setExpansions(g.expansions);
        }

        try {
          const api = auth.currentUser
            ? await authAxios()
            : axios.create({ baseURL: "http://localhost:3000/api" });
          const resSimilar = await api.get(`/games/${gameId}/similar`);
          setSimilarGames(resSimilar.data || []);
        } catch (_) {}

        try {
          setDlcLoading(true);
          const api = auth.currentUser
            ? await authAxios()
            : axios.create({ baseURL: "http://localhost:3000/api" });
          const resDlc = await api.get(`/games/${gameId}/dlcs`);
          if (resDlc.data?.success) {
            if (resDlc.data.dlcs?.length) setDlcs(resDlc.data.dlcs);
            if (resDlc.data.expansions?.length)
              setExpansions(resDlc.data.expansions);
          }
        } catch (_) {
        } finally {
          setDlcLoading(false);
          setDlcChecked(true);
        }

        if (auth.currentUser) {
          try {
            const api = await authAxios();
            const resLib = await api.get(`/lists/library/${gameId}`);
            setIsFavorite(resLib.data?.success === true);
          } catch (_) {}
        }

        try {
          const api = auth.currentUser
            ? await authAxios()
            : axios.create({ baseURL: "http://localhost:3000/api" });
          const resThreads = await api.get(`/forum/threads?gameId=${gameId}`);
          setGameThread(
            resThreads.data?.success && resThreads.data.threads.length > 0
              ? resThreads.data.threads[0]
              : false,
          );
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

  useEffect(() => {
    if (!gameId) return;
    refreshReviews(true);
    const interval = setInterval(() => refreshReviews(false), 10000);
    return () => clearInterval(interval);
  }, [gameId]);

  const refreshReviews = async (isInitial = false) => {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/reviews/game/${gameId}`,
      );
      if (res.data?.success) {
        const allReviews = res.data.reviews || [];
        setReviews(allReviews);
        setAverageRating(res.data.averageRating);
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

  const handleForumButtonClick = () => {
    if (gameThread) onForumClick?.({ thread: gameThread });
    else onForumClick?.({ gameId: String(gameId), gameName: game.name });
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
      const pseudo =
        user?.pseudo ||
        user?.displayName ||
        auth.currentUser?.displayName ||
        "Anonyme";
      if (myReview)
        await api.put(`/reviews/${gameId}`, {
          rating,
          text: newComment,
          pseudo,
        });
      else
        await api.post(`/reviews`, {
          gameId: String(gameId),
          rating,
          text: newComment,
          pseudo,
        });
      await refreshReviews();
      setShowCommentBox(false);
    } catch (err) {
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
            if (r.id !== reviewId) return r;
            const myUid = auth.currentUser.uid;
            const likedBy = r.likedBy || [];
            const liked = !likedBy.includes(myUid);
            return {
              ...r,
              likedBy: liked
                ? [...likedBy, myUid]
                : likedBy.filter((id) => id !== myUid),
            };
          }),
        );
      }
    } catch (_) {}
  };

  const handleSendComment = async (reviewId) => {
    if (!auth.currentUser) {
      alert("Connectez-vous pour commenter.");
      return;
    }
    if (!reviewCommentText.trim()) return;
    setCommentLoading(true);
    try {
      const api = await authAxios();
      const pseudo =
        user?.pseudo ||
        user?.displayName ||
        auth.currentUser?.displayName ||
        "Anonyme";
      const res = await api.post(`/interactions/reviews/${reviewId}/comments`, {
        text: reviewCommentText,
        pseudo,
      });
      if (res.data.success) {
        setReviewCommentText("");
        setCommentingReviewId(null);
        if (res.data.comment) {
          setReviews((prev) =>
            prev.map((r) =>
              r.id === reviewId
                ? { ...r, comments: [...(r.comments || []), res.data.comment] }
                : r,
            ),
          );
        } else {
          await refreshReviews(false);
        }
      }
    } catch (_) {
      alert("Erreur lors de l'envoi du commentaire.");
    } finally {
      setCommentLoading(false);
    }
  };

  const getCoverUrl = (coverObj) => {
    if (!coverObj) return defaultCover;
    if (coverObj.image_id)
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${coverObj.image_id}.jpg`;
    if (typeof coverObj === "string" && coverObj.startsWith("http"))
      return coverObj;
    return defaultCover;
  };

  const getThumbUrl = (coverObj) => {
    if (!coverObj) return defaultCover;
    if (coverObj.image_id)
      return `https://images.igdb.com/igdb/image/upload/t_cover_small/${coverObj.image_id}.jpg`;
    return defaultCover;
  };

  const displaySummary = () => {
    if (i18n.language === "fr") {
      if (translating) return game?.summary || "";
      return translatedSummary || game?.summary || "Aucun résumé disponible.";
    }
    return game?.summary || "No summary available.";
  };

  if (loading)
    return (
      <div className="app-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );

  const hasDlcContent = dlcs.length > 0 || expansions.length > 0;

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
                  }}
                >
                  {favLoading
                    ? "..."
                    : isFavorite
                      ? "❤️ Dans la collection"
                      : "🤍 Ajouter aux favoris"}
                </button>
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
                  {game.genres?.map((g) => g.name).join(", ") || "—"}
                </p>
                <p>
                  <strong>Plateformes :</strong>{" "}
                  {game.platforms?.map((p) => p.name).join(", ") || "—"}
                </p>
                {game.first_release_date && (
                  <p>
                    <strong>Sortie :</strong>{" "}
                    {formatReleaseDate(game.first_release_date)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── COLONNE DROITE ── */}
          <div className="game-main-info">
            <h1 className="hero-title">{game.name}</h1>

            <div className="section-header">
              <h3 className="section-title">Résumé</h3>
              {translating && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#9333ea",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <div
                    className="loading-spinner"
                    style={{ width: "12px", height: "12px" }}
                  />
                  Traduction…
                </span>
              )}
            </div>
            <p
              className="hero-subtitle"
              style={{ color: "#e2e8f0", marginBottom: "3rem" }}
            >
              {displaySummary()}
            </p>

            {/* ══ DLC & EXPANSIONS ══════════════════════════════════════════ */}
            {(dlcLoading || (dlcChecked && hasDlcContent)) && (
              <div style={{ marginBottom: "3rem" }}>
                <div
                  className="section-header"
                  style={{ marginBottom: "16px" }}
                >
                  <h3 className="section-title">DLC & Extensions</h3>
                  {hasDlcContent && (
                    <span className="section-count">
                      {dlcs.length + expansions.length} contenu
                      {dlcs.length + expansions.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {dlcLoading ? (
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      padding: "12px 0",
                      color: "#64748b",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div
                      className="loading-spinner"
                      style={{ width: "18px", height: "18px" }}
                    />
                    Chargement des DLC…
                  </div>
                ) : (
                  <>
                    {dlcs.length > 0 && expansions.length > 0 && (
                      <div
                        className="categories-nav"
                        style={{ marginBottom: "16px" }}
                      >
                        <button
                          className={`category-btn ${dlcTab === "dlc" ? "active" : ""}`}
                          onClick={() => setDlcTab("dlc")}
                        >
                          🎮 DLC ({dlcs.length})
                        </button>
                        <button
                          className={`category-btn ${dlcTab === "expansion" ? "active" : ""}`}
                          onClick={() => setDlcTab("expansion")}
                        >
                          📦 Expansions ({expansions.length})
                        </button>
                      </div>
                    )}

                    {(dlcTab === "dlc" || expansions.length === 0) &&
                      dlcs.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          {dlcs.length > 0 && expansions.length === 0 && (
                            <p
                              style={{
                                fontSize: "0.78rem",
                                color: "#64748b",
                                marginBottom: "4px",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              DLC
                            </p>
                          )}
                          {dlcs.map((dlc) => (
                            <DlcCard
                              key={dlc.id}
                              item={dlc}
                              getThumbUrl={getThumbUrl}
                              onGameClick={onGameClick}
                            />
                          ))}
                        </div>
                      )}

                    {(dlcTab === "expansion" || dlcs.length === 0) &&
                      expansions.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          {dlcs.length === 0 && expansions.length > 0 && (
                            <p
                              style={{
                                fontSize: "0.78rem",
                                color: "#64748b",
                                marginBottom: "4px",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              Expansions
                            </p>
                          )}
                          {expansions.map((exp) => (
                            <DlcCard
                              key={exp.id}
                              item={exp}
                              getThumbUrl={getThumbUrl}
                              onGameClick={onGameClick}
                              isExpansion
                            />
                          ))}
                        </div>
                      )}
                  </>
                )}
              </div>
            )}

            {/* ══ AVIS ══════════════════════════════════════════════════════ */}
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
                    ⭐ {averageRating} / 5{" "}
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
                    placeholder="Partagez votre expérience... (optionnel)"
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
                  const isCommenting = commentingReviewId === r.id;
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
                        {auth.currentUser && (
                          <button
                            onClick={() => {
                              setCommentingReviewId(isCommenting ? null : r.id);
                              setReviewCommentText("");
                            }}
                            className="nav-icon-btn"
                            style={{
                              padding: "4px 10px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              color: isCommenting ? "#c084fc" : "#94a3b8",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                            }}
                          >
                            ✍️ {isCommenting ? "Annuler" : "Répondre"}
                          </button>
                        )}
                      </div>

                      {r.comments && r.comments.length > 0 && (
                        <div
                          style={{
                            marginTop: "12px",
                            marginLeft: "10px",
                            paddingLeft: "12px",
                            borderLeft: "2px solid rgba(147,51,234,0.3)",
                          }}
                        >
                          {r.comments.map((c, idx) => (
                            <div
                              key={c.id || idx}
                              style={{
                                background: "rgba(255,255,255,0.03)",
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
                                {c.pseudo || c.userId || "Anonyme"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {isCommenting && (
                        <div
                          style={{
                            marginTop: "12px",
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                            paddingTop: "12px",
                          }}
                        >
                          <textarea
                            className="filter-select"
                            style={{
                              width: "100%",
                              minHeight: "70px",
                              fontSize: "0.85rem",
                              padding: "10px",
                              resize: "vertical",
                              marginBottom: "8px",
                            }}
                            value={reviewCommentText}
                            onChange={(e) =>
                              setReviewCommentText(e.target.value)
                            }
                            placeholder="Écrire une réponse..."
                            autoFocus
                          />
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              className="nav-user-btn"
                              style={{
                                padding: "6px 18px",
                                fontSize: "0.85rem",
                                opacity:
                                  commentLoading || !reviewCommentText.trim()
                                    ? 0.5
                                    : 1,
                              }}
                              onClick={() => handleSendComment(r.id)}
                              disabled={
                                commentLoading || !reviewCommentText.trim()
                              }
                            >
                              {commentLoading ? "Envoi..." : "Envoyer"}
                            </button>
                            <button
                              className="category-btn"
                              style={{
                                padding: "6px 14px",
                                fontSize: "0.85rem",
                              }}
                              onClick={() => {
                                setCommentingReviewId(null);
                                setReviewCommentText("");
                              }}
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ══ JEUX SIMILAIRES ══════════════════════════════════════════ */}
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

/* ── Carte DLC / Expansion ───────────────────────────────────────────────── */
const DlcCard = ({ item, getThumbUrl, onGameClick, isExpansion = false }) => {
  const releaseDate = item.first_release_date
    ? new Date(item.first_release_date * 1000).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div
      onClick={() => onGameClick?.(item.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "12px 16px",
        borderRadius: "12px",
        cursor: "pointer",
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${isExpansion ? "rgba(96,165,250,0.2)" : "rgba(147,51,234,0.2)"}`,
        transition: "all 0.15s",
        overflow: "hidden",
        minWidth: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isExpansion
          ? "rgba(96,165,250,0.06)"
          : "rgba(147,51,234,0.06)";
        e.currentTarget.style.borderColor = isExpansion
          ? "rgba(96,165,250,0.4)"
          : "rgba(147,51,234,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
        e.currentTarget.style.borderColor = isExpansion
          ? "rgba(96,165,250,0.2)"
          : "rgba(147,51,234,0.2)";
      }}
    >
      <div
        style={{
          width: "48px",
          height: "62px",
          borderRadius: "6px",
          overflow: "hidden",
          flexShrink: 0,
          background: "#1e293b",
        }}
      >
        <img
          src={getThumbUrl(item.cover)}
          alt={item.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: "600",
              padding: "1px 7px",
              borderRadius: "99px",
              background: isExpansion
                ? "rgba(96,165,250,0.15)"
                : "rgba(147,51,234,0.15)",
              color: isExpansion ? "#60a5fa" : "#c084fc",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              flexShrink: 0,
            }}
          >
            {isExpansion ? "Expansion" : "DLC"}
          </span>
          {releaseDate && (
            <span
              style={{ fontSize: "0.72rem", color: "#64748b", flexShrink: 0 }}
            >
              {releaseDate}
            </span>
          )}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "0.9rem",
            color: "#e2e8f0",
            fontWeight: "500",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
        </p>
        {item.summary && (
          <p
            style={{
              margin: "3px 0 0",
              fontSize: "0.75rem",
              color: "#64748b",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
              minWidth: 0,
            }}
          >
            {item.summary}
          </p>
        )}
      </div>

      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#475569"
        strokeWidth="2"
        style={{ flexShrink: 0 }}
      >
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </div>
  );
};

export default Jeu;
