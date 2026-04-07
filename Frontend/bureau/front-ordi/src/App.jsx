import React, { useState } from 'react';
import Accueil from './pages/Accueil';
import Login from './pages/Login';
import Register from './pages/Register';
import Utilisateur from './pages/utilisateur';
import Jeu from './pages/Jeu'; // Assurez-vous de créer ce fichier
import "../Style/Styles.css";
import './Langue/i18n';

const App = () => {
  // États pour la navigation et l'utilisateur
  const [currentPage, setCurrentPage] = useState('accueil');
  const [user, setUser] = useState(null); // null = déconnecté
  const [selectedGameId, setSelectedGameId] = useState(null); // ID du jeu à afficher

  // Fonction pour gérer la connexion ET la mise à jour du profil
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (currentPage === 'login' || currentPage === 'register') {
      setCurrentPage('accueil');
    }
  };

  // Fonction pour la déconnexion
  const handleLogout = () => {
    setUser(null);
    setCurrentPage('accueil');
  };

  // Fonction pour aller sur la page d'un jeu spécifique
  const handleShowGame = (id) => {
    setSelectedGameId(id);
    setCurrentPage('jeu');
  };

  return (
    <div style={styles.appContainer}>
      {/* --- NAVBAR --- */}
      <nav style={styles.navbar}>
        <h1 style={styles.logo} onClick={() => setCurrentPage('accueil')}>SUPCONTENT</h1>
        <div>
          {user ? (
            <button style={styles.navBtn} onClick={() => setCurrentPage('utilisateur')}>
              👤 {user.pseudo}
            </button>
          ) : (
            <button style={styles.navBtn} onClick={() => setCurrentPage('login')}>
              CONNEXION
            </button>
          )}
        </div>
      </nav>

      {/* --- CONTENU DYNAMIQUE --- */}
      <main style={styles.mainContent}>
        {currentPage === 'accueil' && (
          <Accueil user={user} onGameClick={handleShowGame} />
        )}
        
        {currentPage === 'jeu' && (
          <Jeu 
            gameId={selectedGameId} 
            onBack={() => setCurrentPage('accueil')} 
          />
        )}

        {currentPage === 'login' && (
          <Login 
            onSwitch={() => setCurrentPage('register')} 
            onLoginSuccess={handleLoginSuccess} 
          />
        )}

        {currentPage === 'register' && (
          <Register onSwitch={() => setCurrentPage('login')} />
        )}

        {currentPage === 'utilisateur' && (
          <Utilisateur 
            user={user} 
            onLogout={handleLogout} 
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </main>
    </div>
  );
};

const styles = {
  appContainer: { minHeight: '100vh', background: '#0f172a', color: 'white' },
  navbar: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    padding: '15px 50px', background: '#1e1e38', borderBottom: '1px solid #334155' 
  },
  logo: { color: '#b208b4', cursor: 'pointer', margin: 0, fontSize: '1.5rem' },
  navBtn: { 
    background: '#b208b4', color: 'white', border: 'none', padding: '10px 20px', 
    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s'
  },
  mainContent: { padding: '20px' }
};

export default App;