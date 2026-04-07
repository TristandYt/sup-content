import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../Style/Styles.css";

const Jeu = ({ gameId, onBack, user }) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [showCommentBox, setShowCommentBox] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        // 1. Récupération des détails du jeu
        const res = await axios.get(
          `http://localhost:3000/api/games/details/${gameId}`,
        );
        if (res.data && res.data.length > 0) {
          const gameData = res.data[0];
          setGame(gameData);

          // 2. Vérification FAVORIS (Hybride BDD / Local)
          if (user) {
            // On vérifie d'abord en local pour la rapidité
            const localLib =
              JSON.parse(localStorage.getItem(`library_${user.email}`)) || [];
            setIsFavorite(localLib.some((item) => item.id === gameId));
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

  // --- LOGIQUE FAVORIS (BDD + LOCAL) ---
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
        // SUPPRIMER
        await axios.delete(
          `http://localhost:3000/api/user/favorites/${user.id}/${gameId}`,
        );

        // Update Local
        const local = JSON.parse(localStorage.getItem(storageKey)) || [];
        const filtered = local.filter((item) => item.id !== gameId);
        localStorage.setItem(storageKey, JSON.stringify(filtered));
      } else {
        // AJOUTER
        await axios.post(`http://axios:3000/api/user/favorites`, {
          userId: user.id,
          ...gameData,
        });

        // Update Local
        const local = JSON.parse(localStorage.getItem(storageKey)) || [];
        localStorage.setItem(storageKey, JSON.stringify([...local, gameData]));
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error("Erreur BDD, bascule en mode Local uniquement");

      // Secours : si la BDD n'est pas encore prête, on le fait quand même en local pour tester
      let local = JSON.parse(localStorage.getItem(storageKey)) || [];
      if (isFavorite) {
        local = local.filter((item) => item.id !== gameId);
      } else {
        local.push(gameData);
      }
      localStorage.setItem(storageKey, JSON.stringify(local));
      setIsFavorite(!isFavorite);
    }
  };

  const handleSaveComment = async () => {
    if (!newComment.trim()) return;
    try {
      const commentData = {
        gameId,
        userId: user?.id,
        text: newComment,
        date: new Date().toLocaleDateString(),
      };
      await axios.post(`http://localhost:3000/api/comments`, commentData);
      setComments([...comments, commentData]);
      setNewComment("");
      setShowCommentBox(false);
    } catch (err) {
      alert("Erreur lors de l'enregistrement du commentaire");
    }
  };

  if (loading) return <div className="game-details-page">Chargement...</div>;
  if (!game) return <div className="game-details-page">Jeu introuvable.</div>;

  return (
    <div className="game-details-page">
      <button onClick={onBack} className="btn-back">
        ← Retour à l'accueil
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
              <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 28.5L4.5 17C1.9 14.4 1.9 10.1 4.5 7.5C7.1 4.9 11.4 4.9 14 7.5L16 9.5L18 7.5C20.6 4.9 24.9 4.9 27.5 7.5C30.1 10.1 30.1 14.4 27.5 17L16 28.5Z" />
              </svg>
            </button>
          </div>

          <p className="rating-text">
            ⭐ {(game.total_rating / 20).toFixed(1)} / 5
          </p>
          <h3 className="section-subtitle">Résumé</h3>
          <p className="summary-text">
            {game.summary || "Aucun résumé disponible."}
          </p>

          <div className="comments-section">
            <div className="comments-header">
              <h3>Commentaires ({comments.length})</h3>
              <button
                className="btn-open-comment"
                onClick={() => setShowCommentBox(!showCommentBox)}
              >
                {showCommentBox ? "Annuler" : "Ajouter un commentaire"}
              </button>
            </div>

            {showCommentBox && (
              <div className="comment-input-area">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Écrivez votre avis ici..."
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
              {comments.length > 0 ? (
                comments.map((c, index) => (
                  <div key={index} className="comment-item">
                    <p className="comment-text">{c.text}</p>
                    <span className="comment-date">Posté le {c.date}</span>
                  </div>
                ))
              ) : (
                <p className="no-comments">
                  Soyez le premier à donner votre avis !
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jeu;
