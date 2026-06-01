import React, { useState, useEffect, useRef } from "react";
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
import "../Style/Styles.css";
import "./Langue/i18n";

const authAxios = async () => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  const token = await firebaseUser.getIdToken(); // Removed 'true' to use cached token
  return axios.create({
    baseURL: "http://localhost:3000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

const App = () => {
  // ── Navigation stack ──────────────────────────────────────────────────────
  const [navStack, setNavStack] = useState([{ page: "accueil" }]);
  const current = navStack[navStack.length - 1];
  const currentPage = current.page;

  const navigate = (entry) => {
    setNavStack((prev) => [...prev, entry]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setNavStack((prev) => {
      if (prev.length <= 1) return [{ page: "accueil" }];
      return prev.slice(0, -1);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goHome = () => {
    setNavStack([{ page: "accueil" }]);
  };

  // ── Auth persistante ──────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
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
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              pseudo: firebaseUser.displayName,
              username: firebaseUser.displayName,
              displayName: firebaseUser.displayName,
              avatar: firebaseUser.photoURL || null,
            });
          }
        } catch (err) {
          console.warn("Erreur récupération profil au démarrage:", err);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            pseudo: firebaseUser.displayName,
            username: firebaseUser.displayName,
            displayName: firebaseUser.displayName,
            avatar: firebaseUser.photoURL || null,
          });
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── State annexe ──────────────────────────────────────────────────────────
  const [profileRefresh, setProfileRefresh] = useState(0);
  const [preselectedConversation, setPreselectedConversation] = useState(null);

  // ── Search ────────────────────────────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ── Notifications ─────────────────────────────────────────────────────────
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
    } catch (err) {
      console.error("Erreur notifications:", err);
    }
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

  // ── Unread messages count ─────────────────────────────────────────────────
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const myId = user?.uid || user?.id || "";

  const fetchUnreadMessageCount = async () => {
    if (!auth.currentUser) return;
    try {
      const api = await authAxios();
      if (!api) return;
      const res = await api.get("/conversations");
      if (res.data.success) {
        const convs = res.data.conversations || [];
        // On compte les conversations dont le dernier message n'est pas de moi
        // et dont unreadCount > 0 (si le backend le fournit), sinon on vérifie
        // lastMessageSender
        const unread = convs.filter((c) => {
          if (c.unreadCount && c.unreadCount > 0) return true;
          // Fallback : dernier message envoyé par quelqu'un d'autre
          if (
            c.lastMessage &&
            c.lastMessageSender &&
            String(c.lastMessageSender) !== String(myId)
          ) {
            return true;
          }
          return false;
        });
        setUnreadMessageCount(unread.length);
      }
    } catch (err) {
      console.error("Erreur unread messages:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadMessageCount();
      const interval = setInterval(fetchUnreadMessageCount, 5000);
      return () => clearInterval(interval);
    } else {
      setUnreadMessageCount(0);
    }
  }, [user?.uid, myId]);

  // Quand on ouvre la messagerie, on remet le compteur à 0 visuellement
  // (il sera recalculé au prochain poll)
  useEffect(() => {
    if (currentPage === "messagerie") {
      setUnreadMessageCount(0);
    }
  }, [currentPage]);

  useEffect(() => {
    const handle = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifications(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    setShowSearch(false);
    setSearchTerm("");
  }, [currentPage]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    goHome();
  };

  const handleShowGame = (id) => navigate({ page: "jeu", gameId: id });
  const handleUserClick = (userId) =>
    navigate({ page: "utilisateur_public", userId });
  const handleOpenMessaging = (conversation) => {
    setPreselectedConversation(conversation);
    navigate({ page: "messagerie" });
  };
  const handleAdminClick = () => navigate({ page: "admin" });
  const handleForumClick = (payload) =>
    navigate({ page: "forum", forumThread: payload });
  const handleOpenForum = () => navigate({ page: "forum", forumThread: null });

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

  // ── Écran de chargement ───────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
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
                  onClick={goHome}
                  style={{ cursor: "pointer" }}
                >
                  <span className="logo-emoji">🎮</span>
                </div>
                <h1
                  className="logo-text"
                  onClick={goHome}
                  style={{ cursor: "pointer" }}
                >
                  TGMF
                </h1>
              </div>

              <div className="navbar-actions">
                {navStack.length > 1 && (
                  <button
                    className="nav-icon-btn"
                    onClick={goBack}
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
                  onClick={() => {
                    setShowSearch(true);
                    goHome();
                  }}
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
                                } catch (_) {}
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
                      navigate({ page: "messagerie" });
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

                <button
                  className="nav-user-btn"
                  onClick={() =>
                    navigate({ page: user ? "utilisateur" : "login" })
                  }
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

      {/* ══ CONTENU ══════════════════════════════════════════════════════════ */}
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
            gameId={current.gameId}
            onBack={goBack}
            user={user}
            onFavoriteChange={() => setProfileRefresh((n) => n + 1)}
            onGameClick={handleShowGame}
            onForumClick={handleForumClick}
          />
        )}
        {currentPage === "login" && (
          <Login
            onSwitch={() => navigate({ page: "register" })}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
        {currentPage === "register" && (
          <Register onSwitch={() => navigate({ page: "login" })} />
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
              auth.signOut();
              goHome();
            }}
            onGameClick={handleShowGame}
            onAdminClick={handleAdminClick}
          />
        )}
        {currentPage === "utilisateur_public" && (
          <Utilisateur
            key={current.userId}
            targetUserId={current.userId}
            user={user}
            isPublic={true}
            onBack={goBack}
            onOpenMessaging={handleOpenMessaging}
            onGameClick={handleShowGame}
          />
        )}
        {currentPage === "messagerie" && (
          <Messagerie
            user={user}
            preselectedConversation={preselectedConversation}
            onConversationOpen={() => setPreselectedConversation(null)}
            onMessagesRead={fetchUnreadMessageCount}
          />
        )}
        {currentPage === "forum" && (
          <Forum
            user={user}
            onGameClick={handleShowGame}
            initialThread={current.forumThread}
          />
        )}
        {currentPage === "admin" && <AdminDashboard onBack={goBack} />}
      </main>
    </div>
  );
};

export default App;
