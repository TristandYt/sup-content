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

        // 1. Récupération des détails du jeu
        // Le backend renvoie directement l'objet gameData
        const res = await axios.get(
          `http://localhost:3000/api/games/details/${gameId}`,
        );

        if (res.data) {
          const gameData = res.data;
          setGame(gameData);

          // 2. Vérification des Favoris dans le localStorage
          if (user) {
            const localLib =
              JSON.parse(localStorage.getItem(`library_${user.email}`)) || [];
            // Utilisation de String() pour comparer les IDs de types différents (nombre vs chaîne)
            setIsFavorite(
              localLib.some((item) => String(item.id) === String(gameId)),
            );
          }
        }

        // 3. Récupération des commentaires
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
      alert("Vous devez être connecté pour ajouter un favori.");
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
      console.error("Erreur API, bascule en mode local uniquement", err);
      let local = JSON.parse(localStorage.getItem(storageKey)) || [];
      if (isFavorite) {
        local = local.filter((i) => String(i.id) !== String(gameId));
      } else {
        local.push(gameData);
      }
      localStorage.setItem(storageKey, JSON.stringify(local));
      setIsFavorite(!isFavorite);
    }
  };

  const handleSaveComment = async () => {
    if (!newComment.trim() || rating === 0) {
      alert("Merci d'ajouter un texte et une note !");
      return;
    }
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
      alert("Erreur lors de l'envoi du commentaire.");
    }
  };

  if (loading) return <div className="game-details-page">Chargement...</div>;
  if (!game) return <div className="game-details-page">Jeu introuvable.</div>;

  return (
    <div className="game-details-page">
      <button onClick={onBack} className="btn-back">
        ← Retour
      </button>

      <div className="game-main-container">
        <div className="game-sidebar">
          <img
            src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover?.image_id}.jpg`}
            alt={game.name}
            className="game-cover-img"
          />
          <div className="game-meta-under-cover">
            <p>
              <strong>Genres:</strong>{" "}
              {game.genres?.map((g) => g.name).join(", ") || "N/A"}
            </p>
            <p>
              <strong>Plateformes:</strong>{" "}
              {game.platforms?.map((p) => p.name).join(", ") || "N/A"}
            </p>
          </div>
        </div>

        <div className="game-info-content">
          <div className="game-title-row">
            <h1>{game.name}</h1>
            <button
              onClick={toggleFavorite}
              className={`minimal-heart-btn ${isFavorite ? "active" : ""}`}
            >
              <svg viewBox="0 0 32 32">
                <path d="M16 28.5L4.5 17C1.9 14.4 1.9 10.1 4.5 7.5C7.1 4.9 11.4 4.9 14 7.5L16 9.5L18 7.5C20.6 4.9 24.9 4.9 27.5 7.5C30.1 10.1 30.1 14.4 27.5 17L16 28.5Z" />
              </svg>
            </button>
          </div>

          <p className="rating-text">
            ⭐ {game.total_rating ? (game.total_rating / 20).toFixed(1) : "N/A"}{" "}
            / 5 (IGDB)
          </p>
          <h3 className="section-subtitle">Résumé</h3>
          <p className="summary-text">
            {game.summary || "Aucun résumé disponible."}
          </p>

          <div className="comments-section">
            <div className="comments-header">
              <h3>Avis des joueurs ({comments.length})</h3>
              <button
                className="btn-open-comment"
                onClick={() => setShowCommentBox(!showCommentBox)}
              >
                {showCommentBox ? "Annuler" : "Noter ce jeu"}
              </button>
            </div>

            {showCommentBox && (
              <div className="comment-input-area">
                <div className="star-rating-selector">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star-icon ${(hoverRating || rating) >= star ? "filled" : ""}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      ★
                    </span>
                  ))}
                  <span className="rating-label">{rating}/5</span>
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Votre avis sur ce titre..."
                />
                <button
                  onClick={handleSaveComment}
                  className="save-comment-btn"
                >
                  Publier
                </button>
              </div>
            )}

            <div className="comments-list">
              {comments.map((c, index) => (
                <div key={index} className="comment-item">
                  <div className="comment-header-info">
                    <span className="comment-rating">
                      {"★".repeat(c.rating)}
                      {"☆".repeat(5 - c.rating)}
                    </span>
                    <span className="comment-user">
                      par {c.pseudo || "Anonyme"}
                    </span>
                  </div>
                  <p className="comment-body">{c.text}</p>
                  <span className="comment-date">Le {c.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jeu;
