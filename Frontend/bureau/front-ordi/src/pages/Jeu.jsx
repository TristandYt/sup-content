import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../Style/Styles.css";

const Jeu = ({ gameId, onBack, user }) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState([]);
  const [showCommentBox, setShowCommentBox] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:3000/api/games/details/${gameId}`,
        );

        if (res.data) {
          setGame(res.data);
          if (user) {
            const localLib =
              JSON.parse(localStorage.getItem(`library_${user.email}`)) || [];
            setIsFavorite(
              localLib.some((item) => String(item.id) === String(gameId)),
            );
          }
        }

        const resComments = await axios.get(
          `http://localhost:3000/api/comments/${gameId}`,
        );
        setComments(resComments.data);
      } catch (err) {
        console.error("Erreur de chargement:", err);
      } finally {
        setLoading(false);
      }
    };

    if (gameId) fetchDetails();
  }, [gameId, user]);

  const toggleFavorite = async () => {
    if (!user) {
      alert("Connectez-vous pour ajouter un favori.");
      return;
    }
    const storageKey = `library_${user.email}`;
    const imageUrl = `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover?.image_id}.jpg`;
    const gameData = {
      id: gameId,
      name: game.name,
      image_url: imageUrl,
      status: "A faire",
    };

    try {
      if (isFavorite) {
        await axios.delete(
          `http://localhost:3000/api/user/favorites/${user.id}/${gameId}`,
        );
        const local = JSON.parse(localStorage.getItem(storageKey)) || [];
        localStorage.setItem(
          storageKey,
          JSON.stringify(local.filter((i) => String(i.id) !== String(gameId))),
        );
      } else {
        await axios.post(`http://localhost:3000/api/user/favorites`, {
          userId: user.id,
          ...gameData,
        });
        const local = JSON.parse(localStorage.getItem(storageKey)) || [];
        localStorage.setItem(storageKey, JSON.stringify([...local, gameData]));
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      setIsFavorite(!isFavorite);
    }
  };

  const handleSaveComment = async () => {
    if (!newComment.trim() || rating === 0) return;
    try {
      const commentData = {
        gameId,
        userId: user?.id,
        pseudo: user?.pseudo || "Anonyme",
        text: newComment,
        rating: rating,
        date: new Date().toLocaleDateString(),
      };
      await axios.post(`http://localhost:3000/api/comments`, commentData);
      setComments([commentData, ...comments]);
      setNewComment("");
      setRating(0);
      setShowCommentBox(false);
    } catch (err) {
      alert("Erreur d'envoi");
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
          {/* COLONNE GAUCHE : IMAGE ET META */}
          <div className="game-sidebar-modern">
            <div className="game-card-modern" style={{ cursor: "default" }}>
              <div className="game-image-container">
                <img
                  src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover?.image_id}.jpg`}
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
                  className={`nav-user-btn ${isFavorite ? "" : "category-btn"}`}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    background: isFavorite ? "#ef4444" : "",
                  }}
                >
                  {isFavorite
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
                  <strong>Genres:</strong>{" "}
                  {game.genres?.map((g) => g.name).join(", ")}
                </p>
                <p>
                  <strong>Plateformes:</strong>{" "}
                  {game.platforms?.map((p) => p.name).join(", ")}
                </p>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : INFOS ET COMMENTAIRES */}
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

            <div className="comments-section-modern">
              <div className="section-header">
                <h3 className="section-title">Avis des joueurs</h3>
                <span className="section-count">{comments.length}</span>
                <button
                  className="category-btn active sort-btn"
                  onClick={() => setShowCommentBox(!showCommentBox)}
                >
                  {showCommentBox ? "Annuler" : "Noter le jeu"}
                </button>
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
                  <div
                    className="filters-container"
                    style={{ marginBottom: "1rem" }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        style={{
                          fontSize: "1.5rem",
                          cursor: "pointer",
                          color:
                            (hoverRating || rating) >= star
                              ? "#c084fc"
                              : "#334155",
                        }}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <textarea
                    className="filter-select"
                    style={{
                      width: "100%",
                      minHeight: "100px",
                      marginBottom: "1rem",
                      paddingTop: "10px",
                    }}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Partagez votre expérience sur ce titre..."
                  />
                  <button
                    onClick={handleSaveComment}
                    className="nav-user-btn"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Publier mon avis
                  </button>
                </div>
              )}

              <div className="comments-list-modern">
                {comments.map((c, index) => (
                  <div
                    key={index}
                    className="game-card-modern"
                    style={{
                      padding: "1rem",
                      marginBottom: "1rem",
                      background: "rgba(255,255,255,0.02)",
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
                      <span className="game-genre">{"★".repeat(c.rating)}</span>
                      <span className="game-year">Le {c.date}</span>
                    </div>
                    <p style={{ margin: "0.5rem 0", color: "#cbd5e1" }}>
                      {c.text}
                    </p>
                    <div
                      className="game-title"
                      style={{ fontSize: "0.85rem", color: "#9333ea" }}
                    >
                      — {c.pseudo}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jeu;
