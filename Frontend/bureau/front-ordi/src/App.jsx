import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate, // Ajouté ici
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
import Parametres from "./pages/Parametres.jsx";
import MentionsLegales from "./pages/MentionsLegales.jsx";
import Confidentialite from "./pages/Confidentialite.jsx";
import CGU from "./pages/CGU.jsx";
import APropos from "./pages/APropos";
import logo from "./assets/Logo_PLUSFONCE.png";
import "../Style/Styles.css";
import "./Langue/i18n";

// Guard : redirige vers / si déjà connecté (pour login/register)
const GuestRoute = ({ user, authLoading, children }) => {
  if (authLoading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

// Guard : redirige si pas connecté ou pas admin
const AdminRoute = ({ user, authLoading, children }) => {
  if (authLoading) return null;
  if (!user || user.role !== "admin") return <Navigate to="/" replace />;
  return children;
};

const authAxios = async () => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  const token = await firebaseUser.getIdToken(true);
  return axios.create({
    baseURL: "http://localhost:3000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

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

const AppInner = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  // Rotation dynamique du favicon (270°) via Canvas pour la cohérence avec le logo de la navbar
  useEffect(() => {
    const img = new Image();
    img.src = logo;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((270 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const rotatedLogo = canvas.toDataURL();
      const link = document.querySelector("link[rel~='icon']");
      if (link) link.href = rotatedLogo;
      else {
        const newLink = document.createElement("link");
        newLink.rel = "icon";
        newLink.href = rotatedLogo;
        document.head.appendChild(newLink);
      }
    };
  }, []);

  // Synchronisation de l'état utilisateur local avec le profil stocké en base de données au changement d'auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken(true);
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

  useEffect(() => {
    if (location.pathname === "/messagerie") {
      setUnreadMessageCount(0);
    }
  }, [location.pathname]);

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

  // Récupération périodique du nombre total de messages non lus pour le badge de la navbar
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

  const handleLoginSuccess = () => navigate("/");

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
      <nav className="modern-navbar">
        <div className="navbar-container">
          {!showSearch ? (
            <>
              <div className="navbar-logo-section">
                <div
                  className="logo-icon"
                  onClick={() => navigate("/")}
                  style={{
                    cursor: "pointer",
                    width: "3.5rem",
                    height: "3.5rem",
                  }}
                >
                  <img
                    src={logo}
                    alt="TGMF Logo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      transform: "rotate(270deg)",
                    }}
                  />
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
                    style={{ color: "#c084fc", fontSize: "1.2rem" }}
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>
                )}

                <button
                  className="nav-icon-btn"
                  onClick={toggleTheme}
                  title="Changer de thème"
                  style={{ fontSize: "1.2rem" }}
                >
                  {theme === "dark" ? (
                    <i
                      className="fa-regular fa-sun"
                      style={{ color: "rgb(255, 212, 59)" }}
                    ></i>
                  ) : (
                    <i
                      className="fa-regular fa-moon"
                      style={{ color: "rgb(30, 48, 80)" }}
                    ></i>
                  )}
                </button>

                <button
                  className="nav-icon-btn"
                  onClick={() => setShowSearch(true)}
                  title="Rechercher"
                  style={{
                    fontSize: "1.2rem",
                    color: theme === "light" ? "rgb(30, 48, 80)" : "#fff",
                  }}
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                </button>

                {user && (
                  <div ref={notifRef} style={{ position: "relative" }}>
                    <button
                      className="nav-icon-btn"
                      onClick={() => setShowNotifications((v) => !v)}
                      title="Notifications"
                      style={{
                        position: "relative",
                        fontSize: "1.2rem",
                        color: theme === "light" ? "rgb(30, 48, 80)" : "#fff",
                      }}
                    >
                      <i className="fa-solid fa-bell"></i>
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
                                  if (!api) return;
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
                                <i
                                  className="fa-solid fa-bell-slash"
                                  style={{ color: "rgba(255,255,255,0.2)" }}
                                ></i>
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
                    style={{
                      position: "relative",
                      fontSize: "1.2rem",
                      color: theme === "light" ? "rgb(30, 48, 80)" : "#fff",
                    }}
                  >
                    <i className="fa-solid fa-message"></i>
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
                  style={{
                    fontSize: "1.2rem",
                    color: theme === "light" ? "rgb(30, 48, 80)" : "#fff",
                  }}
                >
                  <i className="fa-solid fa-people-line"></i>
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
                      <i className="fa-solid fa-arrow-right-to-bracket"></i>
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
                          <i className="fa-solid fa-user"></i>
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
                            <i
                              className="fa-solid fa-user"
                              style={{ marginRight: "8px" }}
                            ></i>{" "}
                            Profil
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setDropdownOpened(false);
                              navigate("/parametres");
                            }}
                          >
                            <i
                              className="fa-solid fa-gear"
                              style={{ marginRight: "8px" }}
                            ></i>{" "}
                            Paramètres
                          </button>
                          <div className="dropdown-divider"></div>
                          <button
                            className="dropdown-item logout-btn"
                            onClick={handleLogout}
                          >
                            <i
                              className="fa-solid fa-arrow-right-from-bracket"
                              style={{ marginRight: "8px" }}
                            ></i>{" "}
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
                  <i className="fa-solid fa-magnifying-glass"></i>
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

      {/* Configuration des routes et protection des accès */}
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
              />
            }
          />
          <Route
            path="/login"
            element={
              <GuestRoute user={user} authLoading={authLoading}>
                <Login
                  onSwitch={() => navigate("/register")}
                  onLoginSuccess={handleLoginSuccess}
                />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute user={user} authLoading={authLoading}>
                <Register onSwitch={() => navigate("/login")} />
              </GuestRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute user={user} authLoading={authLoading}>
                <AdminDashboard onBack={() => navigate(-1)} />
              </AdminRoute>
            }
          />
          <Route
            path="/catalogue"
            element={<Catalogue onGameClick={handleShowGame} />}
          />
          <Route
            path="/forum"
            element={<Forum user={user} onUserClick={handleUserClick} />}
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
            path="/messagerie"
            element={
              <Messagerie
                user={user}
                onUserClick={handleUserClick}
                preselectedConversation={preselectedConversation}
              />
            }
          />
          <Route
            path="/profil"
            element={
              <Utilisateur
                key={profileRefresh}
                user={user}
                isPublic={false}
                onBack={() => navigate(-1)}
                onOpenMessaging={handleOpenMessaging}
                onGameClick={handleShowGame}
                onLogout={handleLogout}
              />
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
          <Route path="/parametres" element={<Parametres user={user} />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route path="/cgu" element={<CGU />} />
          <Route path="/a-propos" element={<APropos />} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
