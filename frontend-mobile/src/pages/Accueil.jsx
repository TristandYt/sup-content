import React, { useState, useEffect } from 'react';

const Accueil = ({ onLogin }) => {
  const [items, setItems] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setItems([
        { id: 1, title: "Super Mario 64", genre: "Jeu", note: "4.9", img: "https://via.placeholder.com/400/4e1860/fff?text=Mario+64" },
        { id: 2, title: "Pokémon Soleil", genre: "Jeu", note: "4.3", img: "https://via.placeholder.com/400/4e1860/fff?text=Pokemon+Soleil" },
        { id: 3, title: "Fortnite", genre: "Jeu", note: "1.0", img: "https://via.placeholder.com/400/4e1860/fff?text=Fortnite" },
        { id: 4, title: "Elden Ring", genre: "Jeu", note: "4.9", img: "https://via.placeholder.com/400/4e1860/fff?text=Elden+Ring" },
        { id: 5, title: "Halo: Combat Evolved", genre: "Jeu", note: "4.7", img: "https://via.placeholder.com/400/4e1860/fff?text=Halo" },
        { id: 6, title: "Grand Theft Auto: San Andreas", genre: "Jeu", note: "4.8", img: "https://via.placeholder.com/400/4e1860/fff?text=GTA+SA" },
        { id: 7, title: "Final Fantasy VII", genre: "Jeu", note: "4.9", img: "https://via.placeholder.com/400/4e1860/fff?text=FFVII" },
        { id: 8, title: "Metal Gear Solid", genre: "Jeu", note: "4.8", img: "https://via.placeholder.com/400/4e1860/fff?text=MGS" }
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
                <span style={styles.badge}>{item.genre}</span>
                <p style={styles.itemTitle}>{item.title}</p>
                <p style={{ color: '#b208b4', fontSize: '18px', fontWeight: 'bold', margin: '5px 0 0 0' }}>
                   ⭐ {item.note}/5
                </p>

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
  badge: { fontSize: '10px', background: '#4e1860', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', color: 'white' },
  itemTitle: { margin: '5px 0 0 0', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }
};

export default Accueil;