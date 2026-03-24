import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import "../../Style/Styles.css";

const Accueil = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Nouveaux états pour le tri
  const [sortBy, setSortBy] = useState("total_rating"); // 'name', 'total_rating', ou 'first_release_date'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' ou 'desc'

  const getImageUrl = (game) => {
    if (game.cover && game.cover.image_id) {
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`;
    }
    return "https://via.placeholder.com/400x533/252545/fff?text=No+Cover";
  };

  // Chargement des jeux avec prise en compte du tri global
  const fetchPopular = async () => {
    try {
      setLoading(true);
      // On passe les paramètres de tri à l'URL pour que le backend les utilise
      const res = await axios.get(`http://localhost:3000/api/games/popular`, {
        params: {
          sortBy: sortBy,
          order: sortOrder
        }
      });
      setGames(res.data);
    } catch (err) {
      console.error("Erreur populaires:", err);
    } finally {
      setLoading(false);
    }
  };

  // Recharger les jeux dès que le tri change
  useEffect(() => {
    if (searchTerm.trim() === "") {
      fetchPopular();
    }
  }, [sortBy, sortOrder]); 

  // Gérer la recherche
  useEffect(() => {
    if (searchTerm.trim() === "") {
      fetchPopular();
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

  const controlStyle = {
    backgroundColor: '#1a1a3a',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    padding: '10px 15px',
    outline: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem'
  };

  return (
    <div style={{ width: '100%' }}>
      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2.8rem', margin: 0, color: 'white' }}>{t('homeTitle')}</h2>
        <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>{t('homeSubtitle')}</p>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '20px',
          marginTop: '20px' 
        }}>
          <input
            type="text"
            placeholder={t('Recherche') || "Rechercher un jeu..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', maxWidth: '400px', padding: '12px 20px',
              borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)',
              backgroundColor: '#1a1a3a', color: 'white', outline: 'none'
            }}
          />

          {/* SECTION DE TRI */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={controlStyle}
            >
              <option value="name">Trier par : Nom</option>
              <option value="total_rating">Trier par : Note</option>
              <option value="first_release_date">Trier par : Date</option>
            </select>

            <button 
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              style={controlStyle}
            >
              {sortOrder === "asc" ? "↑ Croissant" : "↓ Décroissant"}
            </button>
          </div>
        </div>
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
            <div key={game.id} className="game-card" style={{ 
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {game.total_rating ? (
                    <p style={{ color: '#b208b4', fontWeight: 'bold', margin: 0 }}>
                      ⭐ {(game.total_rating / 20).toFixed(1)} / 5
                    </p>
                  ) : <span style={{color: '#64748b'}}>N/A</span>}
                  
                  {game.first_release_date && (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(game.first_release_date * 1000).getFullYear()}
                    </span>
                  )}
                </div>
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