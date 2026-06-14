import React, { useState, useEffect, useRef } from "react";
//import { useTranslation } from "react-i18next";
import axios from "axios";
import { auth } from "@monorepo-frontend/shared";
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
  const [setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [setloadingFriends] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const fetchFriends = async () => {
    setloadingFriends(true);
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
      setloadingFriends(false);
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFriends();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        console.error(err)
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
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1001,
          width: "90%",
          maxWidth: "460px",
          background: "#1a1a2e",
          border: "1px solid rgba(139,92,246,0.3)",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
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
          <h3 className="section-title" style={{ margin: 0 }}>
            Nouvelle conversation
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              fontSize: "1.5rem",
              cursor: "pointer",
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
        <input
          ref={inputRef}
          type="text"
          className="messaging-input"
          placeholder="Rechercher un utilisateur…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            marginBottom: "12px",
            boxSizing: "border-box",
          }}
        />
        {error && (
          <p
            style={{
              fontSize: "0.8rem",
              color: "#f87171",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "8px",
              padding: "8px 12px",
              marginBottom: "12px",
            }}
          >
            {error}
          </p>
        )}
        <div style={{ maxHeight: "320px", overflowY: "auto" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "24px" }}>
              <div className="loading-spinner" style={{ margin: "0 auto" }} />
            </div>
          )}
          {!loading && results.length === 0 && query.trim() && !error && (
            <div style={{ textAlign: "center", padding: "30px" }}>
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
                  <span className="messaging-contact-status">
                    {u.bio || "Joueur passionné"}
                  </span>
                </div>
                <span
                  style={{
                    color: "rgba(139,92,246,0.8)",
                    fontSize: "1rem",
                    marginLeft: "auto",
                    flexShrink: 0,
                  }}
                >
                  {actionLoading === (u.id || u.uid) ? "…" : "→"}
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
  //const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const messagesEndRef = useRef(null);
  const selectedConvRef = useRef(null);

  const myId = String(user?.uid || user?.id || "");

  // Garde selectedConv en ref pour les intervalles
  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedConv?.id]);

  /* ── Marquer comme lus + mise à jour locale immédiate ── */
  const markMessagesAsRead = async (convId, msgs) => {
    const unread = msgs.filter(
      (m) => String(m.senderId) !== myId && !m.readBy?.includes(myId),
    );
    if (unread.length === 0) return;

    // 1. Reset local immédiat du badge de la conversation
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
      // 2. Notifier App.js pour recalculer le compteur global
      if (onMessagesRead) onMessagesRead();
    } catch (err) {
      console.error("Erreur lecture:", err);
    }
  };

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
        // Marquer automatiquement comme lus les nouveaux messages reçus
        markMessagesAsRead(selectedConv.id, newMsgs);
      } catch (err) {console.error(err)}
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedConv, activeMenu]);

  const selectConversation = async (conv) => {
    setSelectedConv(conv);
    setMessages([]);
    setActiveMenu(null);
    setLoadingMsgs(true);

    // Reset immédiat du badge dans la liste
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

  const fetchConversations = async (autoSelectId = null, silent = false) => {
    if (!silent) setLoadingConvs(true);
    try {
      const api = await authAxios();
      if (!api) return;
      const res = await api.get("/conversations");
      const convs = res.data.conversations || [];

      setConversations(() => {
        // Si une conv est actuellement ouverte, on garde son unreadCount à 0
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

  useEffect(() => {// eslint-disable-next-line react-hooks/set-state-in-effect
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      selectConversation(found);
    } else {
      fetchConversations(preselectedConversation.id);
    }
    if (onConversationOpen) onConversationOpen();
  }, [preselectedConversation, conversations]);

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
      console.error("Erreur envoi:", err);
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
      console.error("Erreur envoi:", err);
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
  /*
  // Calcul du total de messages non lus (toutes convs sauf celle ouverte)
  const totalUnread = conversations.reduce((acc, c) => {
    if (c.id === selectedConv?.id) return acc;
    return acc + (c.unreadCount || 0);
  }, 0);
   */

  return (
    <div className="messaging-container">
      <div className="messaging-gradient"></div>
      <div className="messaging-layout">
        {/* ── SIDEBAR ── */}
        <aside className="messaging-sidebar">
          <div className="messaging-sidebar-header">
            <div className="messaging-header-content">
              <div className="messaging-icon">💬</div>
              <h3 className="messaging-title">Messages</h3>
            </div>
            <button
              className="messaging-new-btn"
              title="Nouvelle conversation"
              onClick={() => setShowSearchModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#8b5cf6",
                width: "56px",
                height: "36px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          <div className="messaging-contacts-list">
            {loadingConvs ? (
              <div style={{ textAlign: "center", padding: "30px" }}>
                <div className="loading-spinner" style={{ margin: "0 auto" }} />
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <p
                  style={{
                    color: "rgba(255,255,255,0.35)",
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
                // Badge : 0 si la conv est ouverte, sinon unreadCount réel
                const badge = isActive ? 0 : conv.unreadCount || 0;

                return (
                  <div
                    key={conv.id}
                    className={`messaging-contact-item ${isActive ? "active" : ""}`}
                    onClick={() => selectConversation(conv)}
                  >
                    <div className="messaging-contact-avatar-wrapper">
                      <img
                        src={other.avatar}
                        alt={other.pseudo}
                        className="messaging-contact-avatar"
                      />
                      {badge > 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: "-2px",
                            right: "-2px",
                            background: "#9333ea",
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
                    <div className="messaging-contact-info">
                      <span
                        className="messaging-contact-name"
                        style={{ fontWeight: badge > 0 ? "700" : "normal" }}
                      >
                        {other.pseudo}
                      </span>
                      <span
                        className="messaging-contact-status"
                        style={{
                          maxWidth: "140px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                          fontWeight: badge > 0 ? "600" : "normal",
                          color: badge > 0 ? "#c4b5fd" : undefined,
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
        <main className="messaging-main">
          {selectedConv ? (
            <>
              <div className="messaging-chat-header">
                <div className="messaging-chat-header-info">
                  <img
                    src={otherUser.avatar}
                    alt={otherUser.pseudo}
                    className="messaging-header-avatar"
                  />
                  <div>
                    <h4 className="messaging-header-name">
                      {otherUser.pseudo}
                    </h4>
                  </div>
                </div>
                <div className="messaging-chat-actions"></div>
              </div>

              <div className="messaging-messages-area">
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
                  <div className="messaging-no-messages">
                    <div className="messaging-no-messages-icon">💬</div>
                    <p className="messaging-no-messages-text">
                      Aucun message pour le moment
                    </p>
                    <p className="messaging-no-messages-subtext">
                      Envoyez un message pour démarrer la conversation
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
                          style={{ opacity: m._pending ? 0.6 : 1 }}
                        >
                          {!isMine && (
                            <img
                              src={otherUser.avatar}
                              alt=""
                              className="messaging-message-avatar"
                            />
                          )}
                          <div className="messaging-message-content">
                            <div className="messaging-message-bubble">
                              <p className="messaging-message-text">{m.text}</p>
                            </div>
                            <div className="messaging-message-footer">
                              <span className="messaging-message-time">
                                {formatTime(m.createdAt)}
                              </span>
                              {isMine && !m._pending && (
                                <div className="messaging-message-options">
                                  <button
                                    className="messaging-options-btn"
                                    style={{
                                      background: "none",
                                      color: "#ffffff",
                                      border: "none",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      marginLeft: "8px",
                                      fontSize: "1.1rem",
                                    }}
                                    onClick={() =>
                                      setActiveMenu(
                                        activeMenu === m.id ? null : m.id,
                                      )
                                    }
                                  >
                                    ...
                                  </button>
                                  {activeMenu === m.id && (
                                    <div className="messaging-options-menu">
                                      <button
                                        onClick={() => handleEditMessage(m.id)}
                                        className="messaging-option-item"
                                      >
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        >
                                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                        Modifier
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteMessage(m.id)
                                        }
                                        className="messaging-option-item delete"
                                      >
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        >
                                          <polyline points="3 6 5 6 21 6"></polyline>
                                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                        Supprimer
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {isMine &&
                              isLastMessage &&
                              !m._pending &&
                              m.readBy?.length > 1 && (
                                <div
                                  style={{
                                    textAlign: "right",
                                    fontSize: "0.72rem",
                                    color: "#ffffff",
                                    marginTop: "4px",
                                    fontWeight: "700",
                                    paddingRight: "4px",
                                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                                  }}
                                >
                                  Vu
                                </div>
                              )}
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
              >
                <input
                  autoFocus
                  type="text"
                  className="messaging-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage(e);
                  }}
                  placeholder="Écrivez votre message…"
                />
                <button
                  type="submit"
                  className="messaging-send-btn"
                  disabled={!newMessage.trim() || sendLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#8b5cf6",
                    width: "52px",
                    height: "42px",
                    borderRadius: "50%",
                    border: "none",
                    cursor: "pointer",
                    opacity: !newMessage.trim() || sendLoading ? 0.5 : 1,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: "rotate(45deg) translate(-2px, 2px)",
                      width: "28px",
                      height: "28px",
                      display: "block",
                    }}
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="messaging-empty-state">
              <div className="messaging-empty-content">
                <div className="messaging-empty-icon">💬</div>
                <h3 className="messaging-empty-title">
                  Sélectionnez une conversation
                </h3>
                <p className="messaging-empty-text">
                  Choisissez un contact dans la liste ou appuyez sur + pour
                  démarrer une nouvelle conversation
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
