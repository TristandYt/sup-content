import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "./Service/firebase";
import Accueil from "./pages/Accueil";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Utilisateur from "./pages/utilisateur";
import Jeu from "./pages/Jeu";
import Messagerie from "./pages/messagerie";
import AdminDashboard from "./pages/AdminDashboard";
import Forum from "./pages/Forum";
import "../Style/Styles.css";
import "./Langue/i18n";

const authAxios = async () => {
  const token = await auth.currentUser?.getIdToken(true);
  return axios.create({
    baseURL: "http://localhost:3000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

const App = () => {
  const [currentPage, setCurrentPage] = useState("accueil");
  const [user, setUser] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileRefresh, setProfileRefresh] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [preselectedConversation, setPreselectedConversation] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const api = await authAxios();
      const res = await api.get("/notifications");
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error("Erreur notifications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Polling toutes les 30s
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user?.uid]);

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        const api = await authAxios();
        await api.patch(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
        );
      } catch (err) {
        console.error("Erreur mark as read:", err);
      }
    }
    if (notif.gameId) handleShowGame(notif.gameId);
    else if (notif.sourceUserId) handleUserClick(notif.sourceUserId);
    setShowNotifications(false);
  };

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

  const handleUserClick = (userId) => {
    setSelectedUserId(userId);
    setCurrentPage("utilisateur_public");
  };

  const handleOpenMessaging = (conversation) => {
    setPreselectedConversation(conversation);
    setCurrentPage("messagerie");
  };

  const handleAdminClick = () => {
    setCurrentPage("admin");
  };

  // ✅ BUG 1 CORRIGÉ — remet bien la page à "accueil" et vide l'userId
  const handleBackFromPublicProfile = () => {
    setSelectedUserId(null);
    setCurrentPage("accueil");
  };

  return (
    <div className="app-container">
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
                  TGMF
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
                  <div style={{ position: "relative" }}>
                    <button
                      className="nav-icon-btn"
                      onClick={() => setShowNotifications(!showNotifications)}
                      title="Notifications"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 12H16L14 15H10L8 12H2" />
                        <path d="M5.45 5.11L2 12V18A2 2 0 0 0 4 20H20A2 2 0 0 0 22 18V12L18.55 5.11A2 2 0 0 0 16.76 4H7.24A2 2 0 0 0 5.45 5.11Z" />
                      </svg>
                      {notifications.some((n) => !n.isRead) && (
                        <span className="notification-dot"></span>
                      )}
                    </button>

                    {showNotifications && (
                      <div className="notifications-dropdown">
                        <div className="notifications-header">
                          <h3>Notifications</h3>
                        </div>
                        <div className="notifications-list">
                          {notifications.length === 0 ? (
                            <p className="no-notifications">
                              Pas de notifications
                            </p>
                          ) : (
                            notifications.map((n) => (
                              <div
                                key={n.id}
                                className={`notification-item ${n.isRead ? "read" : "unread"}`}
                                onClick={() => handleNotificationClick(n)}
                              >
                                <p>
                                  {n.type === "NEW_FOLLOWER"
                                    ? "Un nouvel utilisateur vous suit !"
                                    : n.type === "NEW_LIKE"
                                      ? "Quelqu'un a aimé votre critique."
                                      : n.type === "NEW_COMMENT"
                                        ? "Un nouveau commentaire sur votre avis."
                                        : n.message || "Nouvelle notification"}
                                </p>
                                <span className="notification-time">
                                  {n.createdAt?.seconds
                                    ? new Date(
                                        n.createdAt.seconds * 1000,
                                      ).toLocaleDateString()
                                    : "Récemment"}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {user && (
                  <button
                    className="nav-icon-btn"
                    onClick={() => {
                      setPreselectedConversation(null);
                      setCurrentPage("messagerie");
                    }}
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
                  className="nav-icon-btn"
                  onClick={() => setCurrentPage("forum")}
                  title="Forum"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>

                <button
                  className="nav-user-btn"
                  onClick={() => setCurrentPage(user ? "utilisateur" : "login")}
                  style={{
                    padding:
                      user?.avatar || user?.photoURL
                        ? "4px 12px 4px 4px"
                        : "0.5rem 1rem",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {user ? (
                    <>
                      {user.avatar || user.photoURL ? (
                        <img
                          src={user.avatar || user.photoURL}
                          alt=""
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
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
                      )}
                      <span>
                        {user.username || user.pseudo || user.displayName}
                      </span>
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

      <main className="main-content-wrapper">
        {currentPage === "accueil" && (
          <Accueil
            onGameClick={handleShowGame}
            onUserClick={handleUserClick}
            searchTerm={searchTerm}
            user={user}
            onAdminClick={handleAdminClick}
          />
        )}

        {currentPage === "jeu" && (
          <Jeu
            gameId={selectedGameId}
            onBack={() => setCurrentPage("accueil")}
            user={user}
            onFavoriteChange={handleFavoriteChange}
            onGameClick={handleShowGame}
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
            onLoginSuccess={(updatedUser) =>
              setUser((prev) => ({ ...prev, ...updatedUser }))
            }
            onLogout={() => {
              setUser(null);
              setCurrentPage("accueil");
            }}
            onGameClick={handleShowGame}
            onAdminClick={handleAdminClick}
          />
        )}

        {/* ✅ BUG 1 CORRIGÉ — onBack pointe vers la bonne fonction */}
        {currentPage === "utilisateur_public" && (
          <Utilisateur
            key={selectedUserId}
            targetUserId={selectedUserId}
            user={user}
            isPublic={true}
            onBack={handleBackFromPublicProfile}
            onOpenMessaging={handleOpenMessaging}
            onGameClick={handleShowGame}
          />
        )}

        {currentPage === "messagerie" && (
          <Messagerie
            user={user}
            preselectedConversation={preselectedConversation}
            onConversationOpen={() => setPreselectedConversation(null)}
          />
        )}

        {currentPage === "forum" && (
          <Forum user={user} onGameClick={handleShowGame} />
        )}

        {currentPage === "admin" && (
          <AdminDashboard onBack={() => setCurrentPage("accueil")} />
        )}
      </main>
    </div>
  );
};

export default App;
