import React from 'react';

const Accueil = () => {
  const medias = [
    { id: 1, title: "Super Mario 64", genre: "Jeu", note: "4.9", img: "https://via.placeholder.com/400/4e1860/fff?text=Mario+64" },
        { id: 2, title: "Pokémon Soleil", genre: "Jeu", note: "4.3", img: "https://via.placeholder.com/400/4e1860/fff?text=Pokemon+Soleil" },
        { id: 3, title: "Fortnite", genre: "Jeu", note: "1.0", img: "https://via.placeholder.com/400/4e1860/fff?text=Fortnite" },
        { id: 4, title: "Elden Ring", genre: "Jeu", note: "4.9", img: "https://via.placeholder.com/400/4e1860/fff?text=Elden+Ring" },
        { id: 5, title: "Halo: Combat Evolved", genre: "Jeu", note: "4.7", img: "https://via.placeholder.com/400/4e1860/fff?text=Halo" },
        { id: 6, title: "Grand Theft Auto: San Andreas", genre: "Jeu", note: "4.8", img: "https://via.placeholder.com/400/4e1860/fff?text=GTA+SA" },
        { id: 7, title: "Final Fantasy VII", genre: "Jeu", note: "4.9", img: "https://via.placeholder.com/400/4e1860/fff?text=FFVII" },
        { id: 8, title: "Metal Gear Solid", genre: "Jeu", note: "4.8", img: "https://via.placeholder.com/400/4e1860/fff?text=MGS" },
  ];

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2.8rem', margin: 0, color: 'white' }}>Tendances mondiales</h2>
        <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>Tout le contenu SUPCONTENT à portée de clic.</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '30px',
        width: '100%'
      }}>
        {medias.map(m => (
          <div key={m.id} style={{ 
            backgroundColor: '#252545', borderRadius: '20px', overflow: 'hidden', 
            border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' 
          }}>
            <img src={m.img} alt={m.title} style={{ width: '100%', height: '400px', objectFit: 'cover' }} />
            <div style={{ padding: '25px' }}>
              <span style={{ fontSize: '12px', background: '#b208b4', color: 'white', padding: '6px 12px', borderRadius: '5px' }}>{m.genre}</span>
              <h3 style={{ fontSize: '20px', margin: '15px 0 5px 0' }}>{m.title}</h3>
              <p style={{ color: '#b208b4', fontSize: '18px', fontWeight: 'bold' }}>⭐ {m.note}/5</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Accueil;