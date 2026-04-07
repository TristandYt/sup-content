import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Style/Styles.css'; 

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
        // Récupération des détails du jeu
        const res = await axios.get(`http://localhost:3000/api/games/details/${gameId}`);
        if (res.data && res.data.length > 0) setGame(res.data[0]);

        // Récupération des commentaires existants
        const resComments = await axios.get(`http://localhost:3000/api/comments/${gameId}`);
        setComments(resComments.data);
      } catch (err) {
        console.error("Erreur de chargement:", err);
      } finally {
        setLoading(false);
      }
    };
    if (gameId) fetchDetails();
  }, [gameId]);

  const handleSaveComment = async () => {
    if (!newComment.trim()) return;
    try {
      const commentData = {
        gameId,
        userId: user?.id,
        text: newComment,
        date: new Date().toLocaleDateString()
      };
      // Envoi au backend pour stockage réel
      await axios.post(`http://localhost:3000/api/comments`, commentData);
      
      setComments([...comments, commentData]);
      setNewComment("");
      setShowCommentBox(false);
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  if (loading) return <div className="game-details-page">Chargement...</div>;
  if (!game) return <div className="game-details-page">Jeu introuvable.</div>;

  return (
    <div className="game-details-page">
      <button onClick={onBack} className="btn-back">← Retour à l'accueil</button>

      <div className="game-main-container">
        {/* COLONNE GAUCHE */}
        <div className="game-sidebar">
          <img 
            src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover?.image_id}.jpg`} 
            alt={game.name} 
            className="game-cover-img"
          />
          <div className="game-meta-under-cover">
            <p><strong>Genres:</strong> {game.genres?.map(g => g.name).join(', ') || 'N/A'}</p>
            <p><strong>Plateformes:</strong> {game.platforms?.map(p => p.name).join(', ') || 'N/A'}</p>
          </div>
        </div>

        {/* COLONNE DROITE */}
        <div className="game-info-content">
          <div className="game-title-row">
            <h1>{game.name}</h1>
            <button 
              onClick={() => setIsFavorite(!isFavorite)} 
              className={`minimal-heart-btn ${isFavorite ? 'active' : ''}`}
            >
              <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 28.5L4.5 17C1.9 14.4 1.9 10.1 4.5 7.5C7.1 4.9 11.4 4.9 14 7.5L16 9.5L18 7.5C20.6 4.9 24.9 4.9 27.5 7.5C30.1 10.1 30.1 14.4 27.5 17L16 28.5Z"/>
              </svg>
            </button>
          </div>

          <p className="rating-text">⭐ {(game.total_rating / 20).toFixed(1)} / 5</p>
          
          <h3 className="section-subtitle">Résumé</h3>
          <p className="summary-text">{game.summary || "Aucun résumé disponible."}</p>

          {/* SECTION COMMENTAIRES */}
          <div className="comments-section">
            <div className="comments-header">
              <h3>Commentaires ({comments.length})</h3>
              <button className="btn-open-comment" onClick={() => setShowCommentBox(!showCommentBox)}>
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
                <button onClick={handleSaveComment} className="save-comment-btn">Publier</button>
              </div>
            )}

            <div className="comments-list">
              {comments.length > 0 ? comments.map((c, index) => (
                <div key={index} className="comment-item">
                  <p className="comment-text">{c.text}</p>
                  <span className="comment-date">Posté le {c.date}</span>
                </div>
              )) : <p className="no-comments">Soyez le premier à donner votre avis !</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jeu;