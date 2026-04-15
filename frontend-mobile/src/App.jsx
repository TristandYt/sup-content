import React, { useState } from 'react';
import Login from './pages/login';
import Register from './pages/Register';
import Accueil from './pages/Accueil'; // La nouvelle page

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* Header avec bouton Accueil */}
      <div style={{ backgroundColor: '#4e1860', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '2px' }}>SUPCONTENT</h1>
        
        {/* Bouton Accueil visible partout sauf si on est déjà sur l'accueil */}
        {currentPage !== 'home' && (
          <button 
            onClick={() => setCurrentPage('home')}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '5px', fontSize: '12px' }}
          >
            ACCUEIL 🏠
          </button>
        )}
      </div>

      <div style={{ padding: '20px' }}>
        {currentPage === 'login' && (
          <Login onSwitch={() => setCurrentPage('register')} />
        )}
        
        {currentPage === 'register' && (
          <Register onSwitch={() => setCurrentPage('login')} />
        )}

        {currentPage === 'home' && (
          <Accueil onLogin={() => setCurrentPage('login')} />
        )}
      </div>
    </div>
  );
}