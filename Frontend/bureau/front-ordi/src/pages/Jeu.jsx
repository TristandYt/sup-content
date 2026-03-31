import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Jeu = ({ gameId, onBack }) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        // Cette route doit exister sur votre backend !
        const res = await axios.get(`http://localhost:3000/api/games/details/${gameId}`);
        
        // IGDB renvoie un tableau, on prend le premier élément
        if (res.data && res.data.length > 0) {
          setGame(res.data[0]);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Erreur détails:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (gameId) fetchDetails();
  }, [gameId]);

  if (loading) return <div style={{ padding: '50px', color: 'white' }}>Chargement...</div>;
  
  if (error || !game) return (
    <div style={{ padding: '50px', color: 'white' }}>
      <p>Jeu introuvable ou erreur serveur.</p>
      <button onClick={onBack} style={btnBackStyle}>Retourner à l'accueil</button>
    </div>
  );

  return (
    <div style={{ color: 'white', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <button onClick={onBack} style={btnBackStyle}>← Retour à l'accueil</button>
      
      <div style={{ display: 'flex', gap: '40px', marginTop: '30px', flexWrap: 'wrap' }}>
        <img 
          src={game.cover ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg` : "https://via.placeholder.com/264x352"} 
          alt={game.name}
          style={{ borderRadius: '15px', width: '300px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
        />
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>{game.name}</h1>
          <div style={{ marginBottom: '20px' }}>
             <span style={{ color: '#b208b4', fontSize: '1.5rem', fontWeight: 'bold' }}>
                ⭐ {game.total_rating ? (game.total_rating / 20).toFixed(1) : 'N/A'} / 5
             </span>
             {game.first_release_date && (
                <span style={{ marginLeft: '20px', color: '#94a3b8' }}>
                  Sortie : {new Date(game.first_release_date * 1000).toLocaleDateString()}
                </span>
             )}
          </div>
          
          <h3 style={{ color: '#b208b4' }}>Résumé</h3>
          <p style={{ lineHeight: '1.8', color: '#cbd5e1', fontSize: '1.1rem' }}>
            {game.summary || "Aucun résumé disponible pour ce jeu."}
          </p>
          
          <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0' }}>Genres</h4>
              <p style={{ color: '#94a3b8' }}>{game.genres?.map(g => g.name).join(', ') || 'N/A'}</p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 5px 0' }}>Plateformes</h4>
              <p style={{ color: '#94a3b8' }}>{game.platforms?.map(p => p.name).join(', ') || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const btnBackStyle = {
  background: '#b208b4',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  marginBottom: '20px'
};

export default Jeu;