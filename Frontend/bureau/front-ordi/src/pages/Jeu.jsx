import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Jeu = ({ gameId, onBack}) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [personalNote, setPersonalNote] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:3000/api/games/details/${gameId}`);
        if (res.data && res.data.length > 0) {
          setGame(res.data[0]);
        }
      } catch (err) {
        console.error("Erreur détails:", err);
      } finally {
        setLoading(false);
      }
    };
    if (gameId) fetchDetails();
  }, [gameId]);

  if (loading) return <div style={{ color: 'white', padding: '50px' }}>Chargement...</div>;
  if (!game) return <div style={{ color: 'white', padding: '50px' }}>Jeu introuvable.</div>;

  // Calcul identique à Accueil.jsx
  const ratingOn5 = game.total_rating ? (game.total_rating / 20).toFixed(1) : "N/A";

  return (
    <div style={{ color: 'white', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <button onClick={onBack} style={styles.btnBack}>← Retour à l'accueil</button>

      <div style={styles.container}>
        {/* Colonne Gauche */}
        <div style={styles.sidebar}>
          <img 
            src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover?.image_id}.jpg`} 
            alt={game.name} 
            style={styles.cover}
          />
          <div style={styles.noteSection}>
            <h4 style={{ color: '#b208b4' }}>Ma note personnelle</h4>
            <textarea 
              style={styles.textarea}
              placeholder="Écrivez votre avis ou vos astuces ici..."
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
            />
            <button style={styles.btnSave}>Sauvegarder</button>
          </div>
        </div>

        {/* Colonne Droite */}
        <div style={styles.content}>
          <div style={styles.headerRow}>
            <h1 style={{ fontSize: '3rem', margin: 0 }}>{game.name}</h1>
            <button 
              onClick={() => setIsFavorite(!isFavorite)} 
              style={{ ...styles.heartBtn, color: isFavorite ? '#ff4b4b' : '#94a3b8' }}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
          </div>

          <p style={styles.rating}>⭐ {ratingOn5} / 5</p>
          
          <h3 style={{ color: '#b208b4' }}>Résumé</h3>
          <p style={styles.summary}>{game.summary || "Aucun résumé disponible."}</p>

          <div style={styles.infoGrid}>
            <p><strong>Genres:</strong> {game.genres?.map(g => g.name).join(', ') || 'N/A'}</p>
            <p><strong>Plateformes:</strong> {game.platforms?.map(p => p.name).join(', ') || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  btnBack: { background: '#b208b4', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' },
  container: { display: 'flex', gap: '40px', flexWrap: 'wrap' },
  sidebar: { flex: '0 0 300px' },
  cover: { width: '100%', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  content: { flex: 1, minWidth: '300px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  heartBtn: { background: 'none', border: 'none', fontSize: '2.5rem', cursor: 'pointer' },
  rating: { color: '#b208b4', fontSize: '1.8rem', fontWeight: 'bold', margin: '15px 0' },
  summary: { lineHeight: '1.7', color: '#cbd5e1' },
  infoGrid: { marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' },
  noteSection: { marginTop: '20px' },
  textarea: { width: '100%', height: '100px', borderRadius: '10px', padding: '10px', background: '#1e1e38', color: 'white', border: '1px solid #334155', outline: 'none' },
  btnSave: { marginTop: '10px', background: '#1e1e38', color: 'white', border: '1px solid #b208b4', padding: '8px', borderRadius: '5px', cursor: 'pointer', width: '100%' }
};

export default Jeu;