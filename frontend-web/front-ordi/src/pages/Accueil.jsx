import React from 'react';

const Accueil = () => {
  const medias = [
    { id: 1, title: "Cyberpunk 2077", genre: "Jeu", note: "4.5", img: "https://via.placeholder.com/400/4e1860/fff?text=Cyberpunk" },
    { id: 2, title: "Interstellar", genre: "Film", note: "4.9", img: "https://via.placeholder.com/400/4e1860/fff?text=Interstellar" },
    { id: 3, title: "Dune: Part Two", genre: "Film", note: "4.8", img: "https://via.placeholder.com/400/4e1860/fff?text=Dune" },
    { id: 4, title: "Elden Ring", genre: "Jeu", note: "4.9", img: "https://via.placeholder.com/400/4e1860/fff?text=Elden+Ring" },
    { id: 5, title: "Batman", genre: "Film", note: "4.2", img: "https://via.placeholder.com/400/4e1860/fff?text=Batman" },
    { id: 6, title: "Starfield", genre: "Jeu", note: "3.8", img: "https://via.placeholder.com/400/4e1860/fff?text=Starfield" },
    { id: 7, title: "The Witcher", genre: "Série", note: "4.6", img: "https://via.placeholder.com/400/4e1860/fff?text=Witcher" },
    { id: 8, title: "Avatar 2", genre: "Film", note: "4.1", img: "https://via.placeholder.com/400/4e1860/fff?text=Avatar" },
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