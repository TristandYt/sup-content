import React, { useState } from 'react';
import Login from './pages/login';
import Register from './pages/Register';
import Accueil from './pages/Accueil'; 

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* Header avec bouton Accueil */}
      <div style={{ backgroundColor: '#4e1860', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h1 
          style={{ margin: 0, fontSize: '1.8rem', cursor: 'pointer', letterSpacing: '3px', fontWeight: 'bold' }} 
          onClick={() => setCurrentPage('home')}
        >
          SUP<span style={{color: '#b208b4'}}>CONTENT</span>
        </h1>
      </div>

      <div style={{ padding: '20px' }}>
         {currentPage === 'home' && (
          <Accueil onLogin={() => setCurrentPage('login')} />
        )}

        {currentPage === 'login' && (
          <Login onSwitch={() => setCurrentPage('register')} />
        )}
        
        {currentPage === 'register' && (
          <Register onSwitch={() => setCurrentPage('login')} />
        )}
      </div>
    </div>
  );
}