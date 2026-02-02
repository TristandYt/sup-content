import React, { useState, useEffect } from 'react';

const Accueil = ({ onLogin }) => {
  const [items, setItems] = useState([]); // Stockera les œuvres de l'API
  const [loading, setLoading] = useState(true);

  // Simulation de l'appel API (IGDB / TMDB via ton Backend)
  useEffect(() => {
    // Ici, tu feras : fetch('http://ton-api-node.com/media')
    setTimeout(() => {
      setItems([
        { id: 1, title: "The Witcher 3", type: "Jeu", img: "https://via.placeholder.com/150x200/4e1860/ffffff?text=Game+1" },
        { id: 2, title: "God of War", type: "jeu", img: "https://via.placeholder.com/150x200/4e1860/ffffff?text=Movie+1" },
        { id: 3, title: "Pokemon Soleil", type: "jeu", img: "https://via.placeholder.com/150x200/4e1860/ffffff?text=Book+1" },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Découvrir</h2>
        <button onClick={onLogin} style={{ background: '#b208b4', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '5px', fontSize: '12px' }}>
          Connexion
        </button>
      </div>

      {/* Barre de recherche (Point 2.2.8) */}
      <input 
        type="text" 
        placeholder="Rechercher un média..." 
        style={styles.searchBar}
      />

      {loading ? (
        <p style={{ textAlign: 'center', color: '#94a3b8' }}>Chargement des pépites...</p>
      ) : (
        <div style={styles.grid}>
          {items.map(item => (
            <div key={item.id} style={styles.card}>
              <img src={item.img} alt={item.title} style={styles.img} />
              <div style={{ padding: '8px' }}>
                <span style={styles.badge}>{item.type}</span>
                <p style={styles.itemTitle}>{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  searchBar: {
    width: '100%', padding: '12px', borderRadius: '10px', background: '#0f172a', 
    border: '1px solid #334155', color: 'white', marginBottom: '20px', boxSizing: 'border-box'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', 
    gap: '15px'
  },
  card: {
    background: '#252545',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  img: { width: '100%', height: '180px', objectFit: 'cover' },
  badge: { fontSize: '10px', background: '#4e1860', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' },
  itemTitle: { margin: '5px 0 0 0', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
};

export default Accueil;