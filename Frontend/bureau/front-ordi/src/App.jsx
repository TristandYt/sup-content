import React, { useState } from "react";
import Accueil from "./pages/Accueil";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Utilisateur from "./pages/utilisateur";
import Jeu from "./pages/Jeu";
import Messagerie from "./pages/messagerie"; // Import de la nouvelle page
import "../Style/Styles.css";
import "./Langue/i18n";

const App = () => {
  const [currentPage, setCurrentPage] = useState("accueil");
  const [user, setUser] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);

  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage("accueil");
  };

  const handleShowGame = (id) => {
    setSelectedGameId(id);
    setCurrentPage("jeu");
  };

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        {!showSearch ? (
          <>
            <h1 style={styles.logo} onClick={() => setCurrentPage("accueil")}>
              SUPCONTENT
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={styles.searchIconTrigger}
                onClick={() => setShowSearch(true)}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>

              {/* BOUTON MESSAGERIE (AVION EN PAPIER) */}
              {user && (
                <button
                  className="msg-nav-btn"
                  onClick={() => setCurrentPage("messagerie")}
                >
                  <svg viewBox="0 0 24 24" className="msg-nav-icon">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              )}

              <button
                style={styles.navBtn}
                onClick={() => setCurrentPage(user ? "utilisateur" : "login")}
              >
                {user ? `👤 ${user.pseudo}` : "CONNEXION"}
              </button>
            </div>
          </>
        ) : (
          <div style={styles.searchOverlay}>
            <div style={styles.searchBarWrapper}>
              <input
                autoFocus
                type="text"
                placeholder="Rechercher"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <div style={styles.blueSearchBtn}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>
            <div
              style={styles.closeBtn}
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
                stroke="white"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </div>
        )}
      </nav>

      <main style={styles.mainContent}>
        {currentPage === "accueil" && (
          <Accueil onGameClick={handleShowGame} searchTerm={searchTerm} />
        )}
        {currentPage === "jeu" && (
          <Jeu
            gameId={selectedGameId}
            onBack={() => setCurrentPage("accueil")}
            user={user}
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

const styles = {
  appContainer: { minHeight: "100vh", background: "#0f172a", color: "white" },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 50px",
    background: "#0f172a",
    borderBottom: "1px solid #1e293b",
    height: "80px",
  },
  logo: {
    color: "#b208b4",
    cursor: "pointer",
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  searchIconTrigger: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  navBtn: {
    background: "#b208b4",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  searchOverlay: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    gap: "15px",
  },
  searchBarWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: "50px",
    padding: "5px 5px 5px 20px",
    border: "1px solid #334155",
    flex: 1,
  },
  searchInput: {
    border: "none",
    outline: "none",
    flex: 1,
    fontSize: "1rem",
    background: "transparent",
    color: "white",
  },
  blueSearchBtn: {
    backgroundColor: "#1d4ed8",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    border: "1px solid #334155",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    background: "transparent",
  },
  mainContent: { padding: "20px 50px" },
};

export default App;
