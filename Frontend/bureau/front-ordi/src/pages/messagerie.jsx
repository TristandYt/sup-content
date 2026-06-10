import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { auth } from "../Service/firebase";
import "../../Style/Styles.css";

const authAxios = async () => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  const token = await firebaseUser.getIdToken();
  return axios.create({
    baseURL: "http://localhost:3000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

/* ═══════════════════════════════════════════════════════════
   MODALE RECHERCHE UTILISATEUR
═══════════════════════════════════════════════════════════ */
const UserSearchModal = ({ onClose, onSelectConversation }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const api = await authAxios();
      const [ingRes, ersRes] = await Promise.all([
        api.get("/follows/me/following"),
        api.get("/follows/me/followers"),
      ]);
      const following = ingRes.data?.following || [];
      const followers = ersRes.data?.followers || [];
      const mutuals = following
          .filter((f) =>
              followers.some(
                  (fol) => String(fol.followerId) === String(f.followingId),
              ),
          )
          .map((f) => ({
            id: f.followingId,
            uid: f.followingId,
            username: f.username || f.pseudo,
            avatar: f.avatar || f.photoURL,
            bio: f.bio,
          }));
      setFriends(mutuals);
    } catch (err) {
      console.error("Erreur chargement amis:", err);
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError("");
      return;
    }
    const delay = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const api = await authAxios();
        const res = await api.get(`/search`, { params: { q: query.trim() } });
        setResults(res.data.results?.users || []);
      } catch (err) {
        setError("Erreur lors de la recherche.");
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [query]);

  const handleSelect = async (u) => {
    const userId = u.id || u.uid;
    setActionLoading(userId);
    setError("");
    try {
      const api = await authAxios();
      const res = await api.post("/conversations", { targetUserId: userId });
      onSelectConversation(res.data.conversation, { ...u, uid: userId });
      onClose();
    } catch (err) {
      const msg = err.response?.data?.msg || "";
      if (msg.toLowerCase().includes("mutuellement")) {
        setError(
            `Vous devez vous suivre mutuellement avec ${u.username || u.pseudo} pour lui écrire.`,
        );
      } else {
        setError(msg || "Impossible d'ouvrir la conversation.");
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
      <>
        <div
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              zIndex: 1000,
              backdropFilter: "blur(4px)",
            }}
        />
        <div
            className="game-card-modern"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1001,
              width: "90%",
              maxWidth: "460px",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              cursor: "default"
            }}
        >
          <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
          >
            <h3 className="section-title" style={{ margin: 0, borderBottom: "none" }}>
              <i className="fa-solid fa-pen-to-square" style={{ color: "#c084fc", marginRight: "8px" }}></i>
              Nouvelle conversation
            </h3>
            <button
                onClick={onClose}
                className="nav-icon-btn"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  padding: 0
                }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div style={{ position: "relative" }}>
            <input
                ref={inputRef}
                type="text"
                className="messaging-input filter-select"
                placeholder="Rechercher un utilisateur…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: "100%",
                  marginBottom: "12px",
                  boxSizing: "border-box",
                  paddingLeft: "36px"
                }}
            />
            <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "12px", top: "12px", opacity: 0.5 }}></i>
          </div>

          {error && (
              <div style={{
                color: "#ef4444",
                background: "rgba(239, 68, 68, 0.1)",
                padding: "8px 12px",
                borderRadius: "8px",
                marginBottom: "12px",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid rgba(239, 68, 68, 0.3)"
              }}>
                <i className="fa-solid fa-circle-xmark"></i> {error}
              </div>
          )}
          <div style={{ maxHeight: "320px", overflowY: "auto", paddingRight: "4px" }}>
            {loading && (
                <div style={{ textAlign: "center", padding: "24px" }}>
                  <div className="loading-spinner" style={{ margin: "0 auto" }} />
                </div>
            )}
            {!loading && results.length === 0 && query.trim() && !error && (
                <div style={{ textAlign: "center", padding: "30px", opacity: 0.5 }}>
                  <i className="fa-solid fa-user-slash" style={{ fontSize: "1.5rem", marginBottom: "8px" }}></i>
                  <p className="empty-text">Aucun utilisateur trouvé</p>
                </div>
            )}
            {!loading &&
                results.map((u) => (
                    <div
                        key={u.id || u.uid}
                        onClick={() => !actionLoading && handleSelect(u)}
                        className="messaging-contact-item"
                        style={{
                          borderRadius: "10px",
                          marginBottom: "6px",
                          cursor:
                              actionLoading === (u.id || u.uid) ? "wait" : "pointer",
                          opacity:
                              actionLoading && actionLoading !== (u.id || u.uid)
                                  ? 0.5
                                  : 1,
                          transition: "opacity 0.2s",
                        }}
                    >
                      <div className="messaging-contact-avatar-wrapper">
                        <img
                            src={
                                u.avatar ||
                                u.photoURL ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username || u.pseudo}`
                            }
                            alt={u.username || u.pseudo}
                            className="messaging-contact-avatar"
                        />
                      </div>
                      <div className="messaging-contact-info">
                  <span className="messaging-contact-name">
                    {u.username || u.pseudo}
                  </span>
                        <span className="messaging-contact-status" style={{ opacity: 0.7 }}>
                    {u.bio || "Joueur passionné"}
                  </span>
                      </div>
                      <span
                          style={{
                            color: "#c084fc",
                            fontSize: "1rem",
                            marginLeft: "auto",
                            flexShrink: 0,
                          }}
                      >
                  {actionLoading === (u.id || u.uid) ? (
                      <div className="loading-spinner" style={{ width: "16px", height: "16px" }}></div>
                  ) : (
                      <i className="fa-solid fa-chevron-right"></i>
                  )}
                </span>
                    </div>
                ))}
          </div>
        </div>
      </>
  );
};

/* ═══════════════════════════════════════════════════════════
   MESSAGERIE PRINCIPALE
═══════════════════════════════════════════════════════════ */
const Messagerie = ({
                      user,
                      preselectedConversation,
                      onConversationOpen,
                      onMessagesRead,
                    }) => {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);
  const selectedConvRef = useRef(null);

  const myId = String(user?.uid || user?.id || "");

  // Garde selectedConv en ref pour les intervalles
  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => fetchConversations(null, true), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!preselectedConversation) return;
    if (conversations.length === 0) return;
    const found = conversations.find(
        (c) => c.id === preselectedConversation.id,
    );
    if (found) {
      selectConversation(found);
    } else {
      fetchConversations(preselectedConversation.id);
    }
    if (onConversationOpen) onConversationOpen();
  }, [preselectedConversation, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedConv?.id]);

  useEffect(() => {
    if (selectedConv && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [selectedConv]);

  useEffect(() => {
    if (!selectedConv) return;
    const interval = setInterval(async () => {
      try {
        const api = await authAxios();
        const res = await api.get(`/conversations/${selectedConv.id}/messages`);
        const newMsgs = res.data.messages || [];
        setMessages((prev) => {
          if (prev.some((m) => m._pending) || activeMenu !== null) return prev;
          return newMsgs;
        });
        markMessagesAsRead(selectedConv.id, newMsgs);
      } catch (err) {}
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedConv, activeMenu]);

  const markMessagesAsRead = async (convId, msgs) => {
    const unread = msgs.filter(
        (m) => String(m.senderId) !== myId && !m.readBy?.includes(myId),
    );
    if (unread.length === 0) return;

    setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c)),
    );

    try {
      const api = await authAxios();
      await Promise.all(
          unread.map((m) =>
              api.patch(`/conversations/${convId}/messages/${m.id}/read`),
          ),
      );
      if (onMessagesRead) onMessagesRead();
    } catch (err) {
      console.error("Erreur lecture:", err);
    }
  };

  const fetchConversations = async (autoSelectId = null, silent = false) => {
    if (!silent) setLoadingConvs(true);
    try {
      const api = await authAxios();
      if (!api) return;
      const res = await api.get("/conversations");
      const convs = res.data.conversations || [];

      setConversations((prev) => {
        const currentId = selectedConvRef.current?.id;
        return convs.map((c) =>
            c.id === currentId ? { ...c, unreadCount: 0 } : c,
        );
      });

      if (silent) return;

      const targetId = autoSelectId || preselectedConversation?.id;
      if (targetId) {
        const target = convs.find((c) => c.id === targetId);
        if (target) {
          selectConversation(target);
          if (onConversationOpen) onConversationOpen();
        }
      }
    } catch (err) {
      console.error("Erreur fetchConversations:", err);
    } finally {
      setLoadingConvs(false);
    }
  };

  const selectConversation = async (conv) => {
    setSelectedConv(conv);
    setMessages([]);
    setActiveMenu(null);
    setLoadingMsgs(true);

    setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
    );

    try {
      const api = await authAxios();
      const res = await api.get(`/conversations/${conv.id}/messages`);
      const msgs = res.data.messages || [];
      setMessages(msgs);
      await markMessagesAsRead(conv.id, msgs);
    } catch (err) {
      console.error("Erreur fetchMessages:", err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || sendLoading) return;

    setSendLoading(true);
    const text = newMessage.trim();
    setNewMessage("");

    const tempMsg = {
      id: `temp_${Date.now()}`,
      senderId: myId,
      text,
      createdAt: { _seconds: Date.now() / 1000 },
      _pending: true,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const api = await authAxios();
      if (!api) throw new Error("Utilisateur non authentifié");
      await api.post(`/conversations/${selectedConv.id}/messages`, { text });
      const res = await api.get(`/conversations/${selectedConv.id}/messages`);
      setMessages(res.data.messages || []);
      setConversations((prev) =>
          prev.map((c) =>
              c.id === selectedConv.id
                  ? { ...c, lastMessage: text, lastMessageAt: Date.now() }
                  : c,
          ),
      );
    } catch (err) {
      console.error("Erreur envoi:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setNewMessage(text);
    } finally {
      setSendLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!selectedConv?.id) return;
    const msgToDelete = messages.find((m) => m.id === messageId);
    if (!window.confirm("Supprimer ce message ?")) {
      setActiveMenu(null);
      return;
    }
    try {
      const api = await authAxios();
      await api.delete(
          `/conversations/${selectedConv.id}/messages/${messageId}`,
      );
      setMessages((prev) => {
        const updated = prev.filter((m) => m.id !== messageId);
        setConversations((convs) =>
            convs.map((c) => {
              if (
                  c.id === selectedConv.id &&
                  c.lastMessage === msgToDelete?.text
              ) {
                const newLast = updated[updated.length - 1];
                return {
                  ...c,
                  lastMessage: newLast
                      ? newLast.text
                      : "Démarrer la conversation",
                };
              }
              return c;
            }),
        );
        return updated;
      });
    } catch (err) {
      alert("Erreur lors de la suppression.");
    } finally {
      setActiveMenu(null);
    }
  };

  const handleEditMessage = async (messageId) => {
    if (!selectedConv?.id) return;
    const msgToEdit = messages.find((m) => m.id === messageId);
    if (!msgToEdit) return;
    const newText = prompt("Modifier votre message :", msgToEdit?.text);
    if (!newText || !newText.trim() || newText === msgToEdit.text) {
      setActiveMenu(null);
      return;
    }
    try {
      const api = await authAxios();
      await api.patch(
          `/conversations/${selectedConv.id}/messages/${messageId}`,
          { text: newText.trim() },
      );
      setMessages((prev) => {
        const updated = prev.map((m) =>
            m.id === messageId ? { ...m, text: newText.trim() } : m,
        );
        const isLast =
            prev.length > 0 && prev[prev.length - 1].id === messageId;
        if (isLast) {
          setConversations((convs) =>
              convs.map((c) =>
                  c.id === selectedConv.id
                      ? { ...c, lastMessage: newText.trim() }
                      : c,
              ),
          );
        }
        return updated;
      });
    } catch (err) {
      alert("Erreur lors de la modification.");
    } finally {
      setActiveMenu(null);
    }
  };

  const getOtherUser = (conv) => {
    if (!conv) return { pseudo: "Inconnu", avatar: null };
    const name =
        conv.otherUserPseudo ||
        conv.otherUserUsername ||
        conv.otherUserDisplayName ||
        conv.pseudo ||
        conv.username ||
        "Utilisateur";
    return {
      pseudo: name,
      avatar:
          conv.otherUserAvatar ||
          conv.otherUserPhotoURL ||
          conv.avatar ||
          conv.photoURL ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
    };
  };

  const formatTime = (createdAt) => {
    if (!createdAt) return "";
    let date;
    if (createdAt?.seconds) date = new Date(createdAt.seconds * 1000);
    else if (createdAt?._seconds) date = new Date(createdAt._seconds * 1000);
    else if (typeof createdAt === "number" || typeof createdAt === "string")
      date = new Date(createdAt);
    else return "";
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const otherUser = getOtherUser(selectedConv);

  return (
      <div className="messaging-container" style={{ position: "relative" }}>
        <div className="messaging-gradient"></div>

        <style>
          {`
          @media (max-width: 768px) {
            .messaging-layout {
              display: flex;
              flex-direction: column !important;
            }
            .messaging-sidebar {
              width: 100% !important;
              max-width: 100% !important;
              border-right: none !important;
              border-bottom: 1px solid rgba(128,128,128,0.2) !important;
              display: ${sidebarOpen ? "flex" : "none"} !important;
              height: ${sidebarOpen ? "100%" : "auto"} !important;
            }
            .messaging-main {
              display: ${sidebarOpen ? "none" : "flex"} !important;
            }
            .mobile-back-btn {
              display: flex !important;
            }
          }
          .mobile-back-btn {
            display: none;
            background: none;
            border: none;
            color: #c084fc;
            font-size: 1.2rem;
            cursor: pointer;
            margin-right: 12px;
            padding: 4px;
          }
        `}
        </style>

        <div className="messaging-layout game-card-modern" style={{ display: "flex", width: "100%", height: "80vh", minHeight: "500px", padding: 0, position: "relative", zIndex: 10, overflow: "hidden" }}>

          {/* ── SIDEBAR ── */}
          <aside className="messaging-sidebar" style={{ width: "320px", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(128,128,128,0.2)" }}>
            <div className="messaging-sidebar-header" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(128,128,128,0.2)" }}>
              <div className="messaging-header-content" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="messaging-icon" style={{ fontSize: "1.2rem", color: "#c084fc" }}>
                  <i className="fa-solid fa-comments"></i>
                </div>
                <h3 className="messaging-title" style={{ margin: 0, fontSize: "1.2rem" }}>Messages</h3>
              </div>
              <button
                  className="messaging-new-btn"
                  title="Nouvelle conversation"
                  onClick={() => setShowSearchModal(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#9333ea",
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "1.2rem",
                    boxShadow: "0 4px 15px rgba(147, 51, 234, 0.3)",
                  }}
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>

            <div className="messaging-contacts-list" style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
              {loadingConvs ? (
                  <div style={{ textAlign: "center", padding: "30px" }}>
                    <div className="loading-spinner" style={{ margin: "0 auto" }} />
                  </div>
              ) : conversations.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <i className="fa-regular fa-comments" style={{ fontSize: "2.5rem", color: "currentColor", opacity: 0.15, marginBottom: "10px" }}></i>
                    <p
                        style={{
                          color: "currentColor",
                          opacity: 0.5,
                          fontSize: "0.85rem",
                          lineHeight: "1.5",
                        }}
                    >
                      Aucune conversation.
                      <br />
                      Appuyez sur + pour en démarrer une.
                    </p>
                  </div>
              ) : (
                  conversations.map((conv) => {
                    const other = getOtherUser(conv);
                    const isActive = selectedConv?.id === conv.id;
                    const badge = isActive ? 0 : conv.unreadCount || 0;

                    return (
                        <div
                            key={conv.id}
                            className={`messaging-contact-item ${isActive ? "active" : ""}`}
                            onClick={() => selectConversation(conv)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "12px",
                              borderRadius: "10px",
                              cursor: "pointer",
                              marginBottom: "4px",
                              background: isActive ? "rgba(147,51,234,0.15)" : "transparent",
                              border: isActive ? "1px solid rgba(147,51,234,0.3)" : "1px solid transparent",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive) e.currentTarget.style.background = "rgba(128,128,128,0.1)";
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) e.currentTarget.style.background = "transparent";
                            }}
                        >
                          <div className="messaging-contact-avatar-wrapper" style={{ position: "relative", marginRight: "12px" }}>
                            <img
                                src={other.avatar}
                                alt={other.pseudo}
                                className="messaging-contact-avatar"
                                style={{ width: "46px", height: "46px", borderRadius: "50%", objectFit: "cover" }}
                            />
                            {badge > 0 && (
                                <span
                                    style={{
                                      position: "absolute",
                                      top: "-2px",
                                      right: "-2px",
                                      background: "#ef4444",
                                      color: "#fff",
                                      borderRadius: "50%",
                                      minWidth: "18px",
                                      height: "18px",
                                      fontSize: "0.7rem",
                                      fontWeight: "700",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      padding: "0 3px",
                                      lineHeight: 1,
                                    }}
                                >
                          {badge > 9 ? "9+" : badge}
                        </span>
                            )}
                          </div>
                          <div className="messaging-contact-info" style={{ flex: 1, minWidth: 0 }}>
                            <span
                                className="messaging-contact-name"
                                style={{
                                  fontWeight: badge > 0 ? "700" : "500",
                                  display: "block",
                                  marginBottom: "4px"
                                }}
                            >
                              {other.pseudo}
                            </span>
                            <span
                                className="messaging-contact-status"
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  display: "block",
                                  fontSize: "0.85rem",
                                  fontWeight: badge > 0 ? "600" : "normal",
                                  color: badge > 0 ? "#c084fc" : "currentColor",
                                  opacity: badge > 0 ? 1 : 0.6
                                }}
                            >
                              {conv.lastMessage || "Démarrer la conversation"}
                            </span>
                          </div>
                        </div>
                    );
                  })
              )}
            </div>
          </aside>

          {/* ── ZONE CHAT ── */}
          <main className="messaging-main" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
            {selectedConv ? (
                <>
                  <div className="messaging-chat-header" style={{ padding: "16px 24px", display: "flex", alignItems: "center", borderBottom: "1px solid rgba(128,128,128,0.2)" }}>
                    <button
                        className="mobile-back-btn"
                        onClick={() => {
                          setSelectedConv(null);
                          setSidebarOpen(true);
                        }}
                    >
                      <i className="fa-solid fa-arrow-left"></i>
                    </button>

                    <div className="messaging-chat-header-info" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img
                          src={otherUser.avatar}
                          alt={otherUser.pseudo}
                          className="messaging-header-avatar"
                          style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                      />
                      <div>
                        <h4 className="messaging-header-name" style={{ margin: 0, fontSize: "1.1rem" }}>
                          {otherUser.pseudo}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <div className="messaging-messages-area" style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column" }}>
                    {loadingMsgs ? (
                        <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              height: "100%",
                            }}
                        >
                          <div className="loading-spinner" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="messaging-no-messages" style={{ margin: "auto", textAlign: "center", opacity: 0.6 }}>
                          <div className="messaging-no-messages-icon" style={{ fontSize: "3rem", marginBottom: "16px", color: "#a78bfa", opacity: 0.6 }}>
                            <i className="fa-solid fa-comments"></i>
                          </div>
                          <p className="messaging-no-messages-text" style={{ fontSize: "1.1rem", marginBottom: "8px" }}>
                            Aucun message pour le moment
                          </p>
                          <p className="messaging-no-messages-subtext" style={{ fontSize: "0.9rem", opacity: 0.7 }}>
                            Envoyez un message pour démarrer la conversation avec {otherUser.pseudo}
                          </p>
                        </div>
                    ) : (
                        <>
                          {messages.map((m, index) => {
                            const isMine = String(m.senderId) === myId;
                            const isLastMessage = index === messages.length - 1;
                            return (
                                <div
                                    key={m.id}
                                    className={`messaging-message ${isMine ? "sent" : "received"}`}
                                    style={{
                                      opacity: m._pending ? 0.6 : 1,
                                      display: "flex",
                                      flexDirection: isMine ? "row-reverse" : "row",
                                      gap: "12px",
                                      marginBottom: "16px",
                                      alignSelf: isMine ? "flex-end" : "flex-start",
                                      maxWidth: "75%"
                                    }}
                                >
                                  {!isMine && (
                                      <img
                                          src={otherUser.avatar}
                                          alt=""
                                          className="messaging-message-avatar"
                                          style={{ width: "32px", height: "32px", borderRadius: "50%", alignSelf: "flex-end" }}
                                      />
                                  )}
                                  <div className="messaging-message-content" style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                                    <div
                                        className="messaging-message-bubble"
                                        style={{
                                          background: isMine ? "linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)" : "var(--bg-secondary, rgba(128,128,128,0.15))",
                                          color: isMine ? "#fff" : "inherit",
                                          padding: "12px 16px",
                                          borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                                          position: "relative"
                                        }}
                                    >
                                      <p className="messaging-message-text" style={{ margin: 0, lineHeight: "1.5", fontSize: "0.95rem", wordBreak: "break-word" }}>{m.text}</p>

                                      {/* Menu options message */}
                                      {isMine && !m._pending && (
                                          <div className="messaging-message-options" style={{ position: "absolute", top: "50%", left: "-30px", transform: "translateY(-50%)" }}>
                                            <button
                                                className="messaging-options-btn"
                                                style={{
                                                  background: "none",
                                                  color: "currentColor",
                                                  opacity: 0.5,
                                                  border: "none",
                                                  cursor: "pointer",
                                                  padding: "4px"
                                                }}
                                                onClick={() =>
                                                    setActiveMenu(
                                                        activeMenu === m.id ? null : m.id,
                                                    )
                                                }
                                            >
                                              <i className="fa-solid fa-ellipsis-vertical"></i>
                                            </button>
                                            {activeMenu === m.id && (
                                                <div className="messaging-options-menu game-card-modern" style={{ position: "absolute", right: "20px", top: "-10px", padding: 0, borderRadius: "8px", overflow: "hidden", zIndex: 100, boxShadow: "0 10px 25px rgba(0,0,0,0.5)", width: "120px" }}>
                                                  <button
                                                      onClick={() => handleEditMessage(m.id)}
                                                      style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px 12px", background: "none", border: "none", color: "inherit", fontSize: "0.85rem", cursor: "pointer", borderBottom: "1px solid rgba(128,128,128,0.2)", textAlign: "left" }}
                                                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(128,128,128,0.1)"}
                                                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                                  >
                                                    <i className="fa-solid fa-pen"></i> Modifier
                                                  </button>
                                                  <button
                                                      onClick={() =>
                                                          handleDeleteMessage(m.id)
                                                      }
                                                      style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px 12px", background: "none", border: "none", color: "#ef4444", fontSize: "0.85rem", cursor: "pointer", textAlign: "left" }}
                                                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                                                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                                  >
                                                    <i className="fa-solid fa-trash"></i> Supprimer
                                                  </button>
                                                </div>
                                            )}
                                          </div>
                                      )}
                                    </div>

                                    <div className="messaging-message-footer" style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <span className="messaging-message-time" style={{ fontSize: "0.7rem", opacity: 0.5 }}>
                                {formatTime(m.createdAt)}
                              </span>

                                      {isMine &&
                                          isLastMessage &&
                                          !m._pending &&
                                          m.readBy?.length > 1 && (
                                              <div
                                                  style={{
                                                    fontSize: "0.7rem",
                                                    color: "#c4b5fd",
                                                    fontWeight: "600",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px"
                                                  }}
                                              >
                                                <i className="fa-solid fa-check-double"></i> Vu
                                              </div>
                                          )}
                                    </div>
                                  </div>
                                </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </>
                    )}
                  </div>

                  <form
                      className="messaging-input-area"
                      onSubmit={handleSendMessage}
                      style={{ padding: "20px", borderTop: "1px solid rgba(128,128,128,0.2)", display: "flex", gap: "12px", alignItems: "center" }}
                  >
                    <input
                        autoFocus
                        type="text"
                        className="messaging-input filter-select"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendMessage(e);
                        }}
                        placeholder="Écrivez votre message…"
                        style={{ flex: 1, margin: 0, padding: "14px 20px", borderRadius: "99px" }}
                    />
                    <button
                        type="submit"
                        className="messaging-send-btn"
                        disabled={!newMessage.trim() || sendLoading}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: !newMessage.trim() || sendLoading ? "rgba(147,51,234,0.3)" : "linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)",
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          border: "none",
                          cursor: !newMessage.trim() || sendLoading ? "default" : "pointer",
                          color: "white",
                          fontSize: "1.2rem",
                          transition: "all 0.2s",
                          flexShrink: 0
                        }}
                    >
                      {sendLoading ? (
                          <div className="loading-spinner" style={{ width: "20px", height: "20px" }}></div>
                      ) : (
                          <i className="fa-solid fa-paper-plane"></i>
                      )}
                    </button>
                  </form>
                </>
            ) : (
                <div className="messaging-empty-state" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div className="messaging-empty-content" style={{ textAlign: "center" }}>
                    <div className="messaging-empty-icon" style={{ fontSize: "4rem", color: "#a78bfa", opacity: 0.6, marginBottom: "20px" }}>
                      <i className="fa-solid fa-comments"></i>
                    </div>
                    <h3 className="messaging-empty-title" style={{ fontSize: "1.5rem", marginBottom: "10px" }}>
                      Sélectionnez une conversation
                    </h3>
                    <p className="messaging-empty-text" style={{ opacity: 0.7, maxWidth: "300px", margin: "0 auto", lineHeight: "1.6" }}>
                      Choisissez un contact dans la liste à gauche ou appuyez sur + pour
                      démarrer une nouvelle discussion
                    </p>
                  </div>
                </div>
            )}
          </main>
        </div>

        {showSearchModal && (
            <UserSearchModal
                onClose={() => setShowSearchModal(false)}
                onSelectConversation={(conv, userInfo) => {
                  setShowSearchModal(false);
                  const enrichedConv = {
                    ...conv,
                    otherUserPseudo: userInfo?.username || userInfo?.pseudo,
                    otherUserAvatar: userInfo?.avatar || userInfo?.photoURL,
                  };
                  setConversations((prev) => {
                    const exists = prev.find((c) => c.id === enrichedConv.id);
                    if (exists) return prev;
                    return [enrichedConv, ...prev];
                  });
                  selectConversation(enrichedConv);
                }}
            />
        )}
      </div>
  );
};

export default Messagerie;