import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import "../../Style/Styles.css";

const Accueil = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper pour l'image (IGDB ne renvoie que l'ID)
  const getImageUrl = (game) => {
    if (game.cover && game.cover.image_id) {
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`;
    }
    return "https://via.placeholder.com/400x533/252545/fff?text=No+Cover";
  };

  // 1. Charger les jeux populaires au montage du composant
  useEffect(() => {
    fetchPopular();
  }, []);

  const fetchPopular = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/games/popular');
      setGames(res.data);
    } catch (err) {
      console.error("Erreur populaires:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Gérer la recherche avec un petit délai (Debounce)
  useEffect(() => {
    if (searchTerm.trim() === "") {
      fetchPopular(); // Si vide, on remet les populaires
      return;
    }

    const delay = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:3000/api/games/search?q=${searchTerm}`);
        setGames(res.data);
      } catch (err) {
        console.error("Erreur recherche:", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  return (
    <div style={{ width: '100%' }}>
      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2.8rem', margin: 0, color: 'white' }}>{t('homeTitle')}</h2>
        <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>{t('homeSubtitle')}</p>

        <input
          type="text"
          placeholder={t('Recherche') || "Rechercher un jeu..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            marginTop: '20px', width: '100%', maxWidth: '400px', padding: '12px 20px',
            borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)',
            backgroundColor: '#1a1a3a', color: 'white', outline: 'none'
          }}
        />
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '30px' 
      }}>
        {loading ? (
          <p style={{ color: 'white' }}>Chargement...</p>
        ) : games.length > 0 ? (
          games.map((game) => (
            <div key={game.id} style={{ 
              backgroundColor: '#252545', borderRadius: '20px', overflow: 'hidden', 
              border: '1px solid rgba(255,255,255,0.1)', transition: '0.3s'
            }}>
              <img 
                src={getImageUrl(game)} 
                alt={game.name} 
                style={{ width: '100%', height: '380px', objectFit: 'cover' }} 
              />
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '18px', margin: '0 0 10px 0', color: 'white' }}>{game.name}</h3>
                {game.total_rating && (
                  <p style={{ color: '#b208b4', fontWeight: 'bold', margin: 0 }}>
                    ⭐ {(game.total_rating / 20).toFixed(1)} / 5
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#94a3b8' }}>Aucun jeu trouvé.</p>
        )}
      </div>
    </div>
  );
};

export default Accueil;