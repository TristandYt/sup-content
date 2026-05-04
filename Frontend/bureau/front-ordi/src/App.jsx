import React, { useState } from "react";
import Accueil from "./pages/Accueil";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Utilisateur from "./pages/utilisateur";
import Jeu from "./pages/Jeu";
import Messagerie from "./pages/messagerie";
import "../Style/Styles.css";
import "./Langue/i18n";

const App = () => {
  const [currentPage, setCurrentPage] = useState("accueil");
  const [user, setUser] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileRefresh, setProfileRefresh] = useState(0);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage("accueil");
  };

  const handleShowGame = (id) => {
    setSelectedGameId(id);
    setCurrentPage("jeu");
  };

  const handleFavoriteChange = () => {
    setProfileRefresh((n) => n + 1);
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="modern-navbar">
        <div className="navbar-container">
          {!showSearch ? (
            <>
              <div className="navbar-logo-section">
                <div
                  className="logo-icon"
                  onClick={() => setCurrentPage("accueil")}
                >
                  <span className="logo-emoji">🎮</span>
                </div>
                <h1
                  className="logo-text"
                  onClick={() => setCurrentPage("accueil")}
                >
                  SUPCONTENT
                </h1>
              </div>

              <div className="navbar-actions">
                <button
                  className="nav-icon-btn"
                  onClick={() => setShowSearch(true)}
                  title="Rechercher"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>

                {user && (
                  <button
                    className="nav-icon-btn"
                    onClick={() => setCurrentPage("messagerie")}
                    title="Messagerie"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    <span className="notification-dot"></span>
                  </button>
                )}

                <button
                  className="nav-user-btn"
                  onClick={() => setCurrentPage(user ? "utilisateur" : "login")}
                >
                  {user ? (
                    <>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>{user.pseudo}</span>
                    </>
                  ) : (
                    <>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                        <polyline points="10 17 15 12 10 7"></polyline>
                        <line x1="15" y1="12" x2="3" y2="12"></line>
                      </svg>
                      <span>Connexion</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="navbar-search-mode">
              <div className="search-bar-wrapper">
                <input
                  autoFocus
                  type="text"
                  placeholder="Rechercher des jeux, discussions, utilisateurs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-modern"
                />
                <div className="search-icon-wrapper">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
              </div>
              <button
                className="search-close-btn"
                onClick={() => {
                  setShowSearch(false);
                  setSearchTerm("");
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Pages */}
      <main className="main-content-wrapper">
        {currentPage === "accueil" && (
          <Accueil onGameClick={handleShowGame} searchTerm={searchTerm} />
        )}
        {currentPage === "jeu" && (
          <Jeu
            gameId={selectedGameId}
            onBack={() => setCurrentPage("accueil")}
            user={user}
            onFavoriteChange={handleFavoriteChange}
          />
        )}
        {currentPage === "login" && (
          <Login
            onSwitch={() => setCurrentPage("register")}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
        {currentPage === "register" && (
          <Register onSwitch={() => setCurrentPage("login")} />
        )}
        {currentPage === "utilisateur" && (
          <Utilisateur
            key={profileRefresh}
            user={user}
            onLogout={() => {
              setUser(null);
              setCurrentPage("accueil");
            }}
          />
        )}
        {currentPage === "messagerie" && <Messagerie user={user} />}
      </main>
    </div>
  );
};

export default App;
