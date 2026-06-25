import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { auth } from "../Service/firebase";
import "../../Style/Styles.css";
import defaultCover from "../assets/fr-default-large_default.jpg";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

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
        <i className="fa-solid fa-star"></i>
      </span>
    ))}
  </div>
);

const formatDate = (updatedAt, locale) => {
  if (!updatedAt) return "";
  const ts = updatedAt?._seconds
    ? new Date(updatedAt._seconds * 1000)
    : new Date(updatedAt);
  return ts.toLocaleDateString(locale);
};

const formatReleaseDate = (timestamp, locale, unknownLabel) => {
  if (!timestamp) return unknownLabel;
  return new Date(timestamp * 1000).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Jeu = ({
  gameId,
  onBack,
  user,
  onFavoriteChange,
  onGameClick,
  onForumClick,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "fr" ? "fr-FR" : "en-US";

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameError, setGameError] = useState(null);
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
  const [dlcTab, setDlcTab] = useState("dlc");

  const [gameThread, setGameThread] = useState(null);

  // États pour la modale de signalement (reviews + commentaires)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState(null);
  const [reportTargetType, setReportTargetType] = useState("comment");
  const [reportReason, setReportReason] = useState(t("jeu_report_reason_spam"));
  const [customReason, setCustomReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    if (game?.name) {
      document.title = `${game.name} | TGMF`;
    } else {
      document.title = "Jeu | TGMF";
    }
  }, [game?.name]);

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

  // Traduction automatique du résumé via l'API MyMemory lorsque l'interface est en français
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

    let isMounted = true;
    const abortController = new AbortController();

    // Nettoyage des données pour éviter les "flashs" d'informations du jeu précédent pendant le chargement
    setIsFavorite(false);
    setReviews([]);
    setAverageRating(null);
    setGameThread(null);
    setCommentingReviewId(null);
    setReviewCommentText("");
    setDlcs([]);
    setExpansions([]);
    setTranslatedSummary("");
    setGame(null);
    setGameError(null);
    window.scrollTo(0, 0);

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setGameError(null);

        // 1. Détails du jeu
        const api = auth.currentUser
          ? await authAxios()
          : axios.create({ baseURL: "http://localhost:3000/api" });

        const res = await api.get(`/games/details/${gameId}`, {
          signal: abortController.signal,
        });
        if (!isMounted || res.data?.id !== gameId) return;
        const g = res.data;
        setGame(g);
        if (g.dlcs?.length) setDlcs(g.dlcs);
        if (g.expansions?.length) setExpansions(g.expansions);

        // 2. Jeux similaires
        try {
          const similarApi = auth.currentUser
            ? await authAxios()
            : axios.create({ baseURL: "http://localhost:3000/api" });
          const resSimilar = await similarApi.get(`/games/${gameId}/similar`, {
            signal: abortController.signal,
          });
          if (isMounted && gameId === gameId) {
            setSimilarGames(resSimilar.data || []);
          }
        } catch (_) {}

        // 3. DLC / extensions
        try {
          setDlcLoading(true);
          const dlcApi = auth.currentUser
            ? await authAxios()
            : axios.create({ baseURL: "http://localhost:3000/api" });
          const resDlc = await dlcApi.get(`/games/${gameId}/dlcs`, {
            signal: abortController.signal,
          });
          if (isMounted && gameId === gameId) {
            if (resDlc.data?.success) {
              if (resDlc.data.dlcs?.length) setDlcs(resDlc.data.dlcs);
              if (resDlc.data.expansions?.length)
                setExpansions(resDlc.data.expansions);
            }
          }
        } catch (_) {
        } finally {
          if (isMounted) setDlcLoading(false);
        }

        // 4. Vérification du favori
        if (auth.currentUser) {
          try {
            const favApi = await authAxios();
            const resLib = await favApi.get(`/lists/library/${gameId}`, {
              signal: abortController.signal,
            });
            if (isMounted && gameId === gameId) {
              setIsFavorite(resLib.data?.success === true);
            }
          } catch (_) {
            if (isMounted) setIsFavorite(false);
          }
        }

        // 5. Fil de discussion forum
        try {
          const threadApi = auth.currentUser
            ? await authAxios()
            : axios.create({ baseURL: "http://localhost:3000/api" });
          const resThreads = await threadApi.get(
            `/forum/threads?gameId=${gameId}`,
            {
              signal: abortController.signal,
            },
          );
          if (isMounted && gameId === gameId) {
            setGameThread(
              resThreads.data?.success && resThreads.data.threads.length > 0
                ? resThreads.data.threads[0]
                : false,
            );
          }
        } catch (_) {
          if (isMounted) setGameThread(false);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Erreur de chargement:", err);
        const status = err?.response?.status;
        if (isMounted) {
          if (status === 401) {
            setGameError({
              code: 401,
              msg: err.response.data?.msg || t("jeu_error_login_required_msg"),
            });
          } else if (status === 403) {
            setGameError({
              code: 403,
              msg: err.response.data?.msg || t("jeu_error_restricted_msg"),
            });
          } else {
            setGameError({ code: 0, msg: t("jeu_error_generic_msg") });
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();

    // Nettoyage : annule les requêtes et ignore les mises à jour si le composant est démonté ou si gameId a changé
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;
    refreshReviews(true);
    const interval = setInterval(() => refreshReviews(false), 10000);
    return () => clearInterval(interval);
  }, [gameId]);

  // Récupère les avis depuis le backend pour calculer la moyenne et identifier l'avis de l'utilisateur
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
      alert(t("jeu_fav_login_alert"));
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
      alert(t("jeu_fav_update_error"));
    } finally {
      setFavLoading(false);
    }
  };

  // Logique pour la création d'une nouvelle critique ou la mise à jour d'une existante
  const handleSaveReview = async () => {
    if (!auth.currentUser) {
      alert(t("jeu_reviews_login_to_review"));
      return;
    }
    if (rating === 0) {
      alert(t("jeu_reviews_choose_rating"));
      return;
    }
    setReviewLoading(true);
    try {
      const api = await authAxios();
      const pseudo =
        user?.pseudo ||
        user?.displayName ||
        auth.currentUser?.displayName ||
        t("jeu_reviews_anonymous");
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
      alert(t("jeu_reviews_send_error"));
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm(t("jeu_reviews_delete_confirm"))) return;
    setReviewLoading(true);
    try {
      const api = await authAxios();
      await api.delete(`/reviews/${gameId}`);
      await refreshReviews();
      setRating(0);
      setNewComment("");
      setShowCommentBox(false);
    } catch (err) {
      alert(t("jeu_reviews_delete_error"));
    } finally {
      setReviewLoading(false);
    }
  };

  // Envoi d'une critique (nouvelle ou mise à jour) vers l'API
  const handleLikeReview = async (reviewId) => {
    if (!auth.currentUser) {
      alert(t("jeu_reviews_login_to_like"));
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
      alert(t("jeu_comment_login_to_comment"));
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
        t("jeu_reviews_anonymous");
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
      alert(t("jeu_comment_send_error"));
    } finally {
      setCommentLoading(false);
    }
  };

  // Ouvre la modale de signalement pour une review ou un commentaire
  const handleReportContent = (targetId, targetType) => {
    setReportTargetId(targetId);
    setReportTargetType(targetType);
    setReportReason(t("jeu_report_reason_spam"));
    setCustomReason("");
    setIsReportModalOpen(true);
  };

  // Soumet le signalement vers l'API
  const handleConfirmReport = async () => {
    const finalReason =
      reportReason === t("jeu_report_reason_other")
        ? customReason.trim()
        : reportReason;
    if (!finalReason) {
      alert(t("jeu_report_modal_invalid_reason"));
      return;
    }

    try {
      const api = await authAxios();
      const res = await api.post(`/moderation/report`, {
        targetId: reportTargetId,
        targetType: reportTargetType,
        reason: finalReason,
      });
      if (res.data.success) {
        setReportSuccess(true);
      }
    } catch (_) {
      alert(t("jeu_report_modal_submit_error"));
    }
  };

  const handleDeleteComment = async (reviewId, commentId) => {
    if (!window.confirm(t("jeu_comment_admin_delete_confirm"))) return;

    try {
      const api = await authAxios();
      const res = await api.delete(
        `/moderation/reviews/${reviewId}/comments/${commentId}`,
      );
      if (res.data.success) {
        alert(t("jeu_comment_admin_delete_success"));
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  comments: (r.comments || []).filter(
                    (c) => c.id !== commentId,
                  ),
                }
              : r,
          ),
        );
      }
    } catch (_) {
      alert(t("jeu_comment_admin_delete_error"));
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

  const getPegiBadgeUrls = (g) => {
    if (!g?.age_ratings || !Array.isArray(g.age_ratings)) return [];
    const urls = [];
    for (const r of g.age_ratings) {
      const ratingObj = typeof r === "object" ? r : { rating: r };
      let url =
        ratingObj.rating_cover_url ||
        ratingObj.rating_cover ||
        ratingObj.rating_cover?.url ||
        null;
      if (!url && ratingObj.rating_cover?.image_id) {
        url = `https://images.igdb.com/igdb/image/upload/t_cover_big/${ratingObj.rating_cover.image_id}.jpg`;
      }
      if (url && !urls.includes(url)) urls.push(url);
    }
    return urls;
  };

  const displaySummary = () => {
    if (i18n.language === "fr") {
      if (translating) return game?.summary || "";
      return translatedSummary || game?.summary || t("jeu_summary_none_fr");
    }
    return game?.summary || t("jeu_summary_none_en");
  };

  if (loading)
    return (
      <div className="app-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
        <Footer />
      </div>
    );

  if (gameError || !game)
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
            ← {t("jeu_back")}
          </button>
          <div className="empty-state">
            <div className="empty-icon">
              {gameError?.code === 401
                ? "🔒"
                : gameError?.code === 403
                  ? "🔞"
                  : "⚠️"}
            </div>
            <h3 className="empty-title">
              {gameError?.code === 401
                ? t("jeu_error_login_required_title")
                : gameError?.code === 403
                  ? t("jeu_error_restricted_title")
                  : t("jeu_error_not_found_title")}
            </h3>
            <p className="empty-text">
              {gameError?.msg || t("jeu_error_not_found_msg")}
            </p>
            {gameError?.code === 401 && (
              <button
                className="category-btn active"
                style={{ marginTop: "1.5rem", padding: "10px 32px" }}
                onClick={() => navigate("/login")}
              >
                {t("jeu_login_button")}
              </button>
            )}
          </div>
        </div>
        <Footer />
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
          <i className="fa-solid fa-arrow-left"></i> {t("jeu_back")}
        </button>

        <div className="game-details-layout" style={{ overflow: "hidden" }}>
          <div className="game-sidebar-modern">
            <div className="game-card-modern" style={{ cursor: "default" }}>
              <div className="game-image-container">
                <img
                  src={getCoverUrl(game.cover)}
                  alt={game.name}
                  className="game-image"
                />
                <div
                  style={{
                    position: "absolute",
                    left: 8,
                    bottom: 8,
                    display: "flex",
                    gap: 8,
                  }}
                >
                  {getPegiBadgeUrls(game).map((u, i) => {
                    let src = u || "";
                    if (src.startsWith("//")) src = `https:${src}`;
                    if (src && !src.startsWith("http")) src = `https:${src}`;
                    return (
                      <img
                        key={i}
                        src={src}
                        alt={`PEGI ${i}`}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: "contain",
                          borderRadius: 6,
                          background: "rgba(0,0,0,0.4)",
                        }}
                      />
                    );
                  })}
                </div>
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
                  {favLoading ? (
                    "..."
                  ) : isFavorite ? (
                    <>
                      <i
                        className="fa-solid fa-heart"
                        style={{ marginRight: "8px" }}
                      ></i>{" "}
                      {t("jeu_fav_in_collection")}
                    </>
                  ) : (
                    <>
                      <i
                        className="fa-regular fa-heart"
                        style={{ marginRight: "8px" }}
                      ></i>{" "}
                      {t("jeu_fav_add")}
                    </>
                  )}
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
                  <i className="fa-solid fa-message"></i>
                  {gameThread
                    ? t("jeu_forum_view_thread")
                    : t("jeu_forum_open_thread")}
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
                {t("jeu_info_title")}
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
                  <strong>{t("jeu_info_genres")}</strong>{" "}
                  {game.genres?.map((g) => g.name).join(", ") ||
                    t("jeu_info_empty")}
                </p>
                <p>
                  <strong>{t("jeu_info_platforms")}</strong>{" "}
                  {game.platforms?.map((p) => p.name).join(", ") ||
                    t("jeu_info_empty")}
                </p>
                {game.first_release_date && (
                  <p>
                    <strong>{t("jeu_info_release")}</strong>{" "}
                    {formatReleaseDate(
                      game.first_release_date,
                      dateLocale,
                      t("jeu_info_unknown_date"),
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div
            className="game-main-info"
            style={{ minWidth: 0, overflow: "hidden" }}
          >
            <h1 className="hero-title">{game.name}</h1>

            <div className="section-header">
              <h3 className="section-title">{t("jeu_summary_title")}</h3>
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
                  {t("jeu_summary_translating")}
                </span>
              )}
            </div>
            <p
              className="hero-subtitle"
              style={{ color: "#e2e8f0", marginBottom: "3rem" }}
            >
              {displaySummary()}
            </p>

            {hasDlcContent || dlcLoading ? (
              <div style={{ marginBottom: "3rem" }}>
                <div
                  className="section-header"
                  style={{ marginBottom: "16px" }}
                >
                  <h3 className="section-title">
                    {t("jeu_dlc_section_title")}
                  </h3>
                  {hasDlcContent && (
                    <span className="section-count">
                      {dlcs.length + expansions.length}{" "}
                      {dlcs.length + expansions.length > 1
                        ? t("jeu_dlc_count_many")
                        : t("jeu_dlc_count_one")}
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
                    {t("jeu_dlc_loading")}
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
                          <i
                            className="fa-solid fa-gamepad"
                            style={{ marginRight: "6px" }}
                          ></i>{" "}
                          {t("jeu_dlc_tab_dlc")} ({dlcs.length})
                        </button>
                        <button
                          className={`category-btn ${dlcTab === "expansion" ? "active" : ""}`}
                          onClick={() => setDlcTab("expansion")}
                        >
                          <i
                            className="fa-solid fa-layer-group"
                            style={{ marginRight: "6px" }}
                          ></i>{" "}
                          {t("jeu_dlc_tab_expansion")} ({expansions.length})
                        </button>
                      </div>
                    )}

                    {(dlcTab === "dlc" || expansions.length === 0) &&
                      dlcs.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            width: "100%",
                            overflow: "hidden",
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
                              {t("jeu_dlc_label_dlc")}
                            </p>
                          )}
                          {dlcs.map((dlc) => (
                            <DlcCard
                              key={dlc.id}
                              item={dlc}
                              getThumbUrl={getThumbUrl}
                              onGameClick={onGameClick}
                              dateLocale={dateLocale}
                              t={t}
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
                            width: "100%",
                            overflow: "hidden",
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
                              {t("jeu_dlc_label_expansion")}
                            </p>
                          )}
                          {expansions.map((exp) => (
                            <DlcCard
                              key={exp.id}
                              item={exp}
                              getThumbUrl={getThumbUrl}
                              onGameClick={onGameClick}
                              isExpansion
                              dateLocale={dateLocale}
                              t={t}
                            />
                          ))}
                        </div>
                      )}
                  </>
                )}
              </div>
            ) : null}

            <div className="comments-section-modern">
              <div className="section-header">
                <h3 className="section-title">{t("jeu_reviews_title")}</h3>
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
                      ? t("jeu_reviews_cancel")
                      : myReview
                        ? t("jeu_reviews_edit_mine")
                        : t("jeu_reviews_rate")}
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
                    {t("jeu_reviews_your_rating")}
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
                    placeholder={t("jeu_reviews_placeholder")}
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
                        ? t("jeu_reviews_sending")
                        : myReview
                          ? t("jeu_reviews_update")
                          : t("jeu_reviews_publish")}
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
                        {t("jeu_reviews_delete")}
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
                    {t("jeu_reviews_empty")}
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
                          {formatDate(r.updatedAt, dateLocale)}
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
                            {t("jeu_reviews_you_suffix")}
                          </span>
                        )}
                      </div>

                      {/* Barre d'actions : like, répondre, signaler */}
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
                        {/* Like */}
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
                          <i
                            className={
                              r.likedBy?.includes(auth.currentUser?.uid)
                                ? "fa-solid fa-heart"
                                : "fa-regular fa-heart"
                            }
                            style={{
                              color: r.likedBy?.includes(auth.currentUser?.uid)
                                ? "#f87171"
                                : "currentColor",
                            }}
                          ></i>
                          <span>{r.likedBy?.length || 0}</span>
                        </button>

                        {/* Répondre */}
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
                            <i
                              className={
                                isCommenting
                                  ? "fa-solid fa-xmark"
                                  : "fa-solid fa-reply"
                              }
                              style={{ marginRight: "4px" }}
                            ></i>
                            {isCommenting
                              ? t("jeu_reviews_reply_cancel")
                              : t("jeu_reviews_reply")}
                          </button>
                        )}

                        {/* Signaler la review (pas sur son propre avis) */}
                        {auth.currentUser && !isMe && (
                          <button
                            onClick={() => handleReportContent(r.id, "review")}
                            className="nav-icon-btn"
                            style={{
                              padding: "4px 10px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              color: "#94a3b8",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                              marginLeft: "auto",
                            }}
                            title={t("jeu_reviews_report_review_title")}
                          >
                            <i
                              className="fa-solid fa-flag"
                              style={{ fontSize: "0.8rem" }}
                            ></i>
                            {t("jeu_reviews_report")}
                          </button>
                        )}

                        {/* Supprimer la review (admin) */}
                        {user?.role === "admin" && (
                          <button
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  t("jeu_reviews_admin_delete_confirm"),
                                )
                              )
                                return;
                              try {
                                const api = await authAxios();
                                const res = await api.delete(
                                  `/moderation/reviews/${r.id}`,
                                );
                                if (res.data.success) {
                                  setReviews((prev) =>
                                    prev.filter((rv) => rv.id !== r.id),
                                  );
                                }
                              } catch (_) {
                                alert(t("jeu_reviews_admin_delete_error"));
                              }
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              padding: "4px 8px",
                              fontSize: "0.8rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title={t("jeu_reviews_admin_delete_title")}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        )}
                      </div>

                      {/* Commentaires sous la review */}
                      {r.comments && r.comments.length > 0 && (
                        <div
                          style={{
                            marginTop: "12px",
                            marginLeft: "10px",
                            paddingLeft: "12px",
                            borderLeft: "2px solid rgba(147,51,234,0.3)",
                          }}
                        >
                          {r.comments.map((c, idx) => {
                            const cId = c.id || idx;
                            return (
                              <div
                                key={cId}
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
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "#9333ea",
                                      fontSize: "0.75rem",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {c.pseudo ||
                                      c.userId ||
                                      t("jeu_reviews_anonymous")}
                                  </span>

                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "10px",
                                      alignItems: "center",
                                    }}
                                  >
                                    {/* Signaler le commentaire */}
                                    {auth.currentUser && (
                                      <button
                                        onClick={() =>
                                          handleReportContent(cId, "comment")
                                        }
                                        style={{
                                          background: "none",
                                          border: "none",
                                          color: "#94a3b8",
                                          cursor: "pointer",
                                          padding: "2px",
                                        }}
                                        title={t("jeu_comment_report_title")}
                                      >
                                        <i
                                          className="fa-solid fa-flag"
                                          style={{ fontSize: "0.75rem" }}
                                        ></i>
                                      </button>
                                    )}
                                    {/* Supprimer le commentaire (admin) */}
                                    {user?.role === "admin" && (
                                      <button
                                        onClick={() =>
                                          handleDeleteComment(r.id, cId)
                                        }
                                        style={{
                                          background: "none",
                                          border: "none",
                                          color: "#ef4444",
                                          cursor: "pointer",
                                          padding: "2px",
                                        }}
                                        title={t(
                                          "jeu_comment_admin_delete_title",
                                        )}
                                      >
                                        <i
                                          className="fa-solid fa-trash-can"
                                          style={{ fontSize: "0.75rem" }}
                                        ></i>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Zone de réponse */}
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
                            placeholder={t("jeu_comment_placeholder")}
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
                              {commentLoading
                                ? t("jeu_comment_sending")
                                : t("jeu_comment_send")}
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
                              {t("jeu_comment_cancel")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {similarGames.length > 0 ? (
              <div style={{ marginTop: "3rem" }}>
                <h3
                  className="section-title"
                  style={{ marginBottom: "1.5rem" }}
                >
                  {t("jeu_similar_title")}
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
                    title={t("jeu_similar_prev")}
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
                    title={t("jeu_similar_next")}
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
            ) : null}
          </div>
        </div>
      </div>

      {/* Modale de signalement (review ou commentaire) */}
      {isReportModalOpen && (
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
            zIndex: 10000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#111118",
              border: "1px solid #1e1e2a",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "440px",
              width: "100%",
              boxSizing: "border-box",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  color: "#e8e8f0",
                  fontWeight: 500,
                }}
              >
                {t("jeu_report_modal_title")}
              </h3>
              <button
                onClick={() => {
                  setIsReportModalOpen(false);
                  setReportSuccess(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#555",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                }}
              >
                ✕
              </button>
            </div>

            {reportSuccess ? (
              <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "14px" }}>
                  <i
                    className="fa-solid fa-circle-check"
                    style={{ color: "#22c55e" }}
                  ></i>
                </div>
                <p
                  style={{
                    color: "#e2e8f0",
                    fontSize: "1rem",
                    fontWeight: 500,
                    marginBottom: "8px",
                  }}
                >
                  {t("jeu_report_modal_success_title")}
                </p>
                <p
                  style={{
                    color: "#888",
                    fontSize: "0.85rem",
                    marginBottom: "24px",
                    lineHeight: "1.5",
                  }}
                >
                  {reportTargetType === "review"
                    ? t("jeu_report_modal_success_review")
                    : t("jeu_report_modal_success_comment")}
                </p>
                <button
                  className="nav-user-btn"
                  style={{ padding: "8px 32px", margin: "0 auto" }}
                  onClick={() => {
                    setIsReportModalOpen(false);
                    setReportSuccess(false);
                  }}
                >
                  {t("jeu_report_modal_close")}
                </button>
              </div>
            ) : (
              <>
                <p
                  style={{
                    color: "#888",
                    fontSize: "0.85rem",
                    marginBottom: "16px",
                    lineHeight: "1.4",
                  }}
                >
                  {reportTargetType === "review"
                    ? t("jeu_report_modal_prompt_review")
                    : t("jeu_report_modal_prompt_comment")}
                </p>

                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="filter-select"
                  style={{
                    width: "100%",
                    marginBottom: "16px",
                    height: "42px",
                    background: "#0a0a0f",
                    border: "1px solid #1e1e2a",
                    color: "#ddd",
                    borderRadius: "6px",
                    padding: "0 10px",
                  }}
                >
                  <option value={t("jeu_report_reason_spam")}>
                    {t("jeu_report_reason_spam")}
                  </option>
                  <option value={t("jeu_report_reason_harassment")}>
                    {t("jeu_report_reason_harassment")}
                  </option>
                  <option value={t("jeu_report_reason_hate")}>
                    {t("jeu_report_reason_hate")}
                  </option>
                  <option value={t("jeu_report_reason_inappropriate")}>
                    {t("jeu_report_reason_inappropriate")}
                  </option>
                  <option value={t("jeu_report_reason_other")}>
                    {t("jeu_report_reason_other")}
                  </option>
                </select>

                {reportReason === t("jeu_report_reason_other") && (
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="filter-select"
                    style={{
                      width: "100%",
                      minHeight: "90px",
                      padding: "10px",
                      marginBottom: "16px",
                      background: "#0a0a0f",
                      border: "1px solid #1e1e2a",
                      color: "#ddd",
                      borderRadius: "6px",
                      resize: "vertical",
                    }}
                    placeholder={t("jeu_report_modal_custom_placeholder")}
                  />
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                    marginTop: "8px",
                  }}
                >
                  <button
                    className="category-btn"
                    onClick={() => setIsReportModalOpen(false)}
                    style={{ padding: "8px 16px" }}
                  >
                    {t("jeu_report_modal_cancel")}
                  </button>
                  <button
                    className="nav-user-btn"
                    style={{ background: "#ef4444", padding: "8px 18px" }}
                    onClick={handleConfirmReport}
                  >
                    {t("jeu_report_modal_submit")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

const DlcCard = ({
  item,
  getThumbUrl,
  onGameClick,
  isExpansion = false,
  dateLocale,
  t,
}) => {
  const releaseDate = item.first_release_date
    ? new Date(item.first_release_date * 1000).toLocaleDateString(dateLocale, {
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
        width: "100%",
        boxSizing: "border-box",
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
            {isExpansion
              ? t("jeu_dlc_label_expansion")
              : t("jeu_dlc_label_dlc")}
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
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
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
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
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
