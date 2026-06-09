import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import { auth } from "./Service/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Accueil from "./pages/Accueil";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Utilisateur from "./pages/utilisateur";
import Jeu from "./pages/Jeu";
import Messagerie from "./pages/messagerie";
import AdminDashboard from "./pages/AdminDashboard";
import Forum from "./pages/Forum";
import Catalogue from "./pages/Catalogue";
import ThemeToggle from "./components/ThemeToggle";
import "../Style/Styles.css";
import "./Langue/i18n";

const authAxios = async () => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  const token = await firebaseUser.getIdToken();
  return axios.create({
    baseURL: "http://localhost:3000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ── Wrappers de pages pour extraire les params d'URL ──────────────────────────

const JeuPage = ({
  user,
  handleShowGame,
  handleForumClick,
  setProfileRefresh,
}) => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  return (
    <Jeu
      gameId={Number(gameId)}
      onBack={() => navigate(-1)}
      user={user}
      onFavoriteChange={() => setProfileRefresh((n) => n + 1)}
      onGameClick={handleShowGame}
      onForumClick={handleForumClick}
    />
  );
};

const UtilisateurPublicPage = ({
  user,
  handleOpenMessaging,
  handleShowGame,
}) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  return (
    <Utilisateur
      key={userId}
      targetUserId={userId}
      user={user}
      isPublic={true}
      onBack={() => navigate(-1)}
      onOpenMessaging={handleOpenMessaging}
      onGameClick={handleShowGame}
    />
  );
};

// ── Composant interne avec accès au router ─────────────────────────────────────

const AppInner = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Intercepteur global Axios pour rediriger vers le form de connexion
  // si un accès non autorisé est détecté (ex: jeu érotique / 18+)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.code === 'LOGIN_REQUIRED') {
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [navigate]);

  const [theme, setTheme] = useState("dark");
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.className = newTheme;
  };

  const [isDropdownOpened, setDropdownOpened] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpened(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── onAuthStateChanged : source unique de vérité pour le user ──────────
  // On charge toujours le profil complet depuis le backend (avec role inclus).
  // handleLoginSuccess ne fait plus que navigate("/") — pas de setUser manuel.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken(true); // force refresh du token
          const res = await axios.get(
            "http://localhost:3000/api/users/profile",
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (res.data.success && res.data.user) {
            const u = res.data.user;
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              pseudo: u.username || u.pseudo || firebaseUser.displayName,
              username: u.username || u.pseudo || firebaseUser.displayName,
              displayName: firebaseUser.displayName,
              avatar: u.avatar || u.photoURL || firebaseUser.photoURL,
              bio: u.bio || "",
              role: u.role || "user",
              birthDate: u.birthDate || "",
              preferences: u.preferences || {},
              isCertified: u.isCertified || false,
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              pseudo: firebaseUser.displayName,
              username: firebaseUser.displayName,
              displayName: firebaseUser.displayName,
              avatar: firebaseUser.photoURL || null,
              role: "user",
            });
          }
        } catch {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            pseudo: firebaseUser.displayName,
            username: firebaseUser.displayName,
            displayName: firebaseUser.displayName,
            avatar: firebaseUser.photoURL || null,
            role: "user",
          });
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [profileRefresh, setProfileRefresh] = useState(0);
  const [preselectedConversation, setPreselectedConversation] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Reset search quand on change de page
  useEffect(() => {
    setShowSearch(false);
    setSearchTerm("");
  }, [location.pathname]);

  // Reset badge messagerie quand on est sur /messagerie
  useEffect(() => {
    if (location.pathname === "/messagerie") {
      setUnreadMessageCount(0);
    }
  }, [location.pathname]);

  // ── Notifications ───────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    if (!auth.currentUser) return;
    try {
      const api = await authAxios();
      if (!api) return;
      const res = await api.get("/notifications");
      if (res.data.success) setNotifications(res.data.notifications);
    } catch {}
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user?.uid]);

  // ── Unread messages ─────────────────────────────────────────────────────
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const fetchUnreadMessageCount = async () => {
    if (!auth.currentUser) return;
    try {
      const api = await authAxios();
      if (!api) return;
      const res = await api.get("/conversations");
      if (res.data.success !== false) {
        const convs = res.data.conversations || [];
        const total = convs.reduce(
          (acc, c) => acc + (Number(c.unreadCount) || 0),
          0,
        );
        setUnreadMessageCount(total);
      }
    } catch {}
  };

  useEffect(() => {
    if (user) {
      fetchUnreadMessageCount();
      const interval = setInterval(fetchUnreadMessageCount, 5000);
      return () => clearInterval(interval);
    } else {
      setUnreadMessageCount(0);
    }
  }, [user?.uid]);

  useEffect(() => {
    const handle = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifications(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── Handlers de navigation ──────────────────────────────────────────────

  // FIX : on ne fait plus setUser ici — onAuthStateChanged s'en charge
  // avec le profil complet (role inclus) depuis le backend.
  const handleLoginSuccess = () => {
    navigate("/");
  };

  const handleLogout = () => {
    setUser(null);
    setDropdownOpened(false);
    auth.signOut();
    navigate("/");
  };

  const handleShowGame = (id) => navigate(`/jeu/${id}`);
  const handleUserClick = (userId) => navigate(`/profil/${userId}`);
  const handleOpenMessaging = (conversation) => {
    setPreselectedConversation(conversation);
    navigate("/messagerie");
  };
  const handleAdminClick = () => navigate("/admin");
  const handleForumClick = (payload) =>
    navigate("/forum", { state: { forumThread: payload } });
  const handleOpenForum = () => navigate("/forum");
  const handleOpenCatalogue = () => navigate("/catalogue");

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        const api = await authAxios();
        await api.patch(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
        );
      } catch {}
    }
    if (notif.gameId) handleShowGame(notif.gameId);
    else if (notif.sourceUserId) handleUserClick(notif.sourceUserId);
    setShowNotifications(false);
  };

  const notifLabel = (n) => {
    const map = {
      follow: "Un nouvel utilisateur vous suit !",
      NEW_FOLLOWER: "Un nouvel utilisateur vous suit !",
      like: "Quelqu'un a aimé votre avis.",
      NEW_LIKE: "Quelqu'un a aimé votre critique.",
      comment: "Un nouveau commentaire sur votre avis.",
      NEW_COMMENT: "Un nouveau commentaire sur votre avis.",
      message: "Vous avez un nouveau message.",
      thread_reply: "Nouvelle réponse dans un fil.",
    };
    return map[n.type] || n.message || "Nouvelle notification";
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (authLoading) {
    return (
      <div
        className="app-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div className="loading-spinner" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
      <nav className="modern-navbar">
        <div className="navbar-container">
          {!showSearch ? (
            <>
              <div className="navbar-logo-section">
                <div
                  className="logo-icon"
                  onClick={() => navigate("/")}
                  style={{ cursor: "pointer" }}
                >
                  <span className="logo-emoji">🎮</span>
                </div>
                <h1
                  className="logo-text"
                  onClick={() => navigate("/")}
                  style={{ cursor: "pointer" }}
                >
                  TGMF
                </h1>
              </div>

              <div className="navbar-actions">
                {location.pathname !== "/" && (
                  <button
                    className="nav-icon-btn"
                    onClick={() => navigate(-1)}
                    title="Retour"
                    style={{ color: "#c084fc" }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                )}

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
                  <div ref={notifRef} style={{ position: "relative" }}>
                    <button
                      className="nav-icon-btn"
                      onClick={() => setShowNotifications((v) => !v)}
                      title="Notifications"
                      style={{ position: "relative" }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                      {unreadCount > 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: "-4px",
                            right: "-4px",
                            background: "#9333ea",
                            color: "#fff",
                            borderRadius: "99px",
                            fontSize: "0.62rem",
                            fontWeight: "700",
                            padding: "1px 5px",
                            minWidth: "16px",
                            textAlign: "center",
                            boxShadow: "0 0 0 2px #0f0f1a",
                          }}
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {showNotifications && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 10px)",
                          right: 0,
                          width: "320px",
                          maxHeight: "420px",
                          background: "#1a1a2e",
                          border: "1px solid rgba(147,51,234,0.3)",
                          borderRadius: "16px",
                          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                          zIndex: 9999,
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 16px",
                            borderBottom: "1px solid rgba(255,255,255,0.07)",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "600",
                              fontSize: "0.9rem",
                              color: "#e2e8f0",
                            }}
                          >
                            Notifications
                            {unreadCount > 0 && (
                              <span
                                style={{
                                  marginLeft: "8px",
                                  background: "rgba(147,51,234,0.2)",
                                  color: "#c084fc",
                                  borderRadius: "99px",
                                  fontSize: "0.68rem",
                                  padding: "1px 7px",
                                }}
                              >
                                {unreadCount} nouvelles
                              </span>
                            )}
                          </span>
                          {unreadCount > 0 && (
                            <button
                              onClick={async () => {
                                try {
                                  const api = await authAxios();
                                  await api.patch("/notifications/read-all");
                                  setNotifications((prev) =>
                                    prev.map((n) => ({ ...n, isRead: true })),
                                  );
                                } catch {}
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#9333ea",
                                fontSize: "0.72rem",
                                fontWeight: "600",
                              }}
                            >
                              Tout lire
                            </button>
                          )}
                        </div>
                        <div style={{ overflowY: "auto", flex: 1 }}>
                          {notifications.length === 0 ? (
                            <div
                              style={{
                                padding: "32px 20px",
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "1.8rem",
                                  marginBottom: "8px",
                                }}
                              >
                                🔕
                              </div>
                              <p
                                style={{
                                  color: "rgba(255,255,255,0.3)",
                                  fontSize: "0.82rem",
                                }}
                              >
                                Aucune notification
                              </p>
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <div
                                key={n.id}
                                onClick={() => handleNotificationClick(n)}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "10px",
                                  padding: "11px 16px",
                                  background: n.isRead
                                    ? "transparent"
                                    : "rgba(147,51,234,0.07)",
                                  borderBottom:
                                    "1px solid rgba(255,255,255,0.04)",
                                  cursor: "pointer",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(255,255,255,0.04)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background = n.isRead
                                    ? "transparent"
                                    : "rgba(147,51,234,0.07)")
                                }
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: "0.8rem",
                                      color: "#cbd5e1",
                                      lineHeight: "1.4",
                                    }}
                                  >
                                    {notifLabel(n)}
                                  </p>
                                  <span
                                    style={{
                                      fontSize: "0.68rem",
                                      color: "rgba(255,255,255,0.25)",
                                      marginTop: "3px",
                                      display: "block",
                                    }}
                                  >
                                    {n.createdAt?.seconds
                                      ? new Date(
                                          n.createdAt.seconds * 1000,
                                        ).toLocaleDateString()
                                      : n.createdAt?._seconds
                                        ? new Date(
                                            n.createdAt._seconds * 1000,
                                          ).toLocaleDateString()
                                        : "Récemment"}
                                  </span>
                                </div>
                                {!n.isRead && (
                                  <div
                                    style={{
                                      width: "7px",
                                      height: "7px",
                                      borderRadius: "50%",
                                      background: "#9333ea",
                                      flexShrink: 0,
                                      marginTop: "4px",
                                    }}
                                  />
                                )}
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
                      navigate("/messagerie");
                    }}
                    title="Messagerie"
                    style={{ position: "relative" }}
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
                    {unreadMessageCount > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-4px",
                          right: "-4px",
                          background: "#9333ea",
                          color: "#fff",
                          borderRadius: "99px",
                          fontSize: "0.62rem",
                          fontWeight: "700",
                          padding: "1px 5px",
                          minWidth: "16px",
                          textAlign: "center",
                          boxShadow: "0 0 0 2px #0f0f1a",
                        }}
                      >
                        {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                      </span>
                    )}
                  </button>
                )}

                <button
                  className="nav-icon-btn"
                  onClick={handleOpenForum}
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

                <div className="profile-dropdown-container" ref={dropdownRef}>
                  {!user ? (
                    <button
                      className="nav-user-btn"
                      onClick={() => navigate("/login")}
                      style={{
                        padding: "0.5rem 1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
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
                      <span>S'inscrire / Connexion</span>
                    </button>
                  ) : (
                    <>
                      <button
                        className="nav-user-btn"
                        onClick={() => setDropdownOpened(!isDropdownOpened)}
                        style={{
                          padding:
                            user?.avatar || user?.photoURL
                              ? "4px 12px 4px 4px"
                              : "0.5rem 1rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
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
                      </button>

                      {isDropdownOpened && (
                        <div className="dropdown-menu">
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setDropdownOpened(false);
                              navigate("/profil");
                            }}
                          >
                            Profil
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setDropdownOpened(false);
                              navigate("/profil");
                            }}
                          >
                            Paramètres
                          </button>
                          <div className="dropdown-item">
                            <span>Thème</span>
                            <ThemeToggle
                              theme={theme}
                              toggleTheme={toggleTheme}
                            />
                          </div>
                          <div className="dropdown-divider"></div>
                          <button
                            className="dropdown-item logout-btn"
                            onClick={handleLogout}
                          >
                            Se déconnecter
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
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
                style={{
                  color: "#ffffff",
                  fontSize: "1.3rem",
                  fontWeight: "300",
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ══ ROUTES ══════════════════════════════════════════════════════════ */}
      <main className="main-content-wrapper">
        <Routes>
          <Route
            path="/"
            element={
              <Accueil
                onGameClick={handleShowGame}
                onUserClick={handleUserClick}
                searchTerm={searchTerm}
                user={user}
                onAdminClick={handleAdminClick}
                onOpenCatalogue={handleOpenCatalogue}
              />
            }
          />
          <Route
            path="/jeu/:gameId"
            element={
              <JeuPage
                user={user}
                handleShowGame={handleShowGame}
                handleForumClick={handleForumClick}
                setProfileRefresh={setProfileRefresh}
              />
            }
          />
          <Route
            path="/login"
            element={
              <Login
                onSwitch={() => navigate("/register")}
                onLoginSuccess={handleLoginSuccess}
              />
            }
          />
          <Route
            path="/register"
            element={<Register onSwitch={() => navigate("/login")} />}
          />
          <Route
            path="/profil"
            element={
              user ? (
                <Utilisateur
                  key={profileRefresh}
                  user={user}
                  onLoginSuccess={(updatedUser) =>
                    setUser((prev) => ({ ...prev, ...updatedUser }))
                  }
                  onLogout={() => {
                    setUser(null);
                    auth.signOut();
                    navigate("/");
                  }}
                  onGameClick={handleShowGame}
                  onAdminClick={handleAdminClick}
                />
              ) : (
                // Pas connecté → redirection login
                <Login
                  onSwitch={() => navigate("/register")}
                  onLoginSuccess={handleLoginSuccess}
                />
              )
            }
          />
          <Route
            path="/profil/:userId"
            element={
              <UtilisateurPublicPage
                user={user}
                handleOpenMessaging={handleOpenMessaging}
                handleShowGame={handleShowGame}
              />
            }
          />
          <Route
            path="/messagerie"
            element={
              <Messagerie
                user={user}
                preselectedConversation={preselectedConversation}
                onConversationOpen={() => setPreselectedConversation(null)}
                onMessagesRead={fetchUnreadMessageCount}
              />
            }
          />
          <Route
            path="/forum"
            element={<ForumPage user={user} handleShowGame={handleShowGame} />}
          />
          <Route
            path="/catalogue"
            element={
              <Catalogue
                onGameClick={handleShowGame}
                user={user}
                searchTerm={searchTerm}
              />
            }
          />
          <Route
            path="/admin"
            element={<AdminDashboard onBack={() => navigate(-1)} />}
          />
        </Routes>
      </main>
    </div>
  );
};

// Wrapper Forum pour lire le state de location (forumThread)
const ForumPage = ({ user, handleShowGame }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const forumThread = location.state?.forumThread || null;
  return (
    <Forum
      user={user}
      onGameClick={handleShowGame}
      initialThread={forumThread}
    />
  );
};

const App = () => (
  <BrowserRouter>
    <AppInner />
  </BrowserRouter>
);

export default App;
