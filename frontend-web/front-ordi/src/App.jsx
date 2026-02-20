import React, { useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Accueil from './pages/Accueil';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const navBtnStyle = { 
    background: '#b208b4', border: 'none', color: 'white', padding: '12px 25px', 
    borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
  };

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
      
      {/* Header Pleine Largeur */}
      <header style={{ 
        backgroundColor: '#4e1860', 
        padding: '15px 4%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <h1 
          style={{ margin: 0, fontSize: '1.8rem', cursor: 'pointer', letterSpacing: '3px', fontWeight: 'bold' }} 
          onClick={() => setCurrentPage('home')}
        >
          SUP<span style={{color: '#b208b4'}}>CONTENT</span>
        </h1>

        {currentPage === 'home' ? (
          <button onClick={() => setCurrentPage('login')} style={navBtnStyle}>CONNEXION</button>
        ) : (
          <button onClick={() => setCurrentPage('home')} style={navBtnStyle}>RETOUR ACCUEIL</button>
        )}
      </header>

      {/* Main sans AUCUNE limite de largeur */}
      <main style={{ width: '100%', padding: '40px 4%', boxSizing: 'border-box' }}>
        {currentPage === 'login' && <Login onSwitch={() => setCurrentPage('register')} />}
        {currentPage === 'register' && <Register onSwitch={() => setCurrentPage('login')} />}
        {currentPage === 'home' && <Accueil />}
      </main>
    </div>
  );
}