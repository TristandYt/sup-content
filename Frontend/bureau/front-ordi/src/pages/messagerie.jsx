import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { auth } from "../Service/firebase";
import "../../Style/Styles.css";

const authAxios = async () => {
  const token = await auth.currentUser?.getIdToken(true);
  return axios.create({
    baseURL: "http://localhost:3000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

/* ═══════════════════════════════════════════════════════════
   MODALE RECHERCHE UTILISATEUR (bouton +)
═══════════════════════════════════════════════════════════ */
const UserSearchModal = ({ onClose, onSelectConversation }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
        console.error("Erreur recherche:", err);
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
const Messagerie = ({ user, preselectedConversation, onConversationOpen }) => {
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
  const messagesEndRef = useRef(null);

  // ✅ BUG 3 CORRIGÉ — récupère l'uid Firebase en priorité, sinon id custom
  const myId = String(user?.uid || user?.id || "");

  useEffect(() => {
    fetchConversations();
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
  }, [messages]);

  const fetchConversations = async (autoSelectId = null) => {
    setLoadingConvs(true);
    try {
      const api = await authAxios();
      const res = await api.get("/conversations");
      const convs = res.data.conversations || [];
      setConversations(convs);
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
    try {
      const api = await authAxios();
      const res = await api.get(`/conversations/${conv.id}/messages`);
      setMessages(res.data.messages || []);
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

    // ✅ BUG 3 CORRIGÉ — senderId = myId pour que le côté sent/received soit correct
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
      console.error("Erreur sendMessage:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setNewMessage(text);
    } finally {
      setSendLoading(false);
    }
  };

  const handleDeleteMessage = (messageId) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    setActiveMenu(null);
  };

  const handleEditMessage = (messageId) => {
    const msgToEdit = messages.find((m) => m.id === messageId);
    const newText = prompt("Modifier votre message :", msgToEdit?.text);
    if (!newText || !newText.trim()) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, text: newText.trim() } : m,
      ),
    );
    setActiveMenu(null);
  };

  const getOtherUser = (conv) => {
    if (!conv) return { pseudo: "Inconnu", avatar: null, status: "offline" };
    return {
      pseudo: conv.otherUserPseudo || "Utilisateur",
      avatar:
        conv.otherUserAvatar ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${conv.otherUserPseudo || "user"}`,
      status: conv.otherUserStatus || "offline",
    };
  };

  // ✅ BUG 3 CORRIGÉ — gère tous les formats de date Firestore possibles
  const formatTime = (createdAt) => {
    if (!createdAt) return "";
    let date;
    if (createdAt?.seconds) {
      // Firestore Timestamp natif
      date = new Date(createdAt.seconds * 1000);
    } else if (createdAt?._seconds) {
      // Firestore Timestamp sérialisé en JSON par le backend
      date = new Date(createdAt._seconds * 1000);
    } else if (typeof createdAt === "number") {
      date = new Date(createdAt);
    } else if (typeof createdAt === "string") {
      date = new Date(createdAt);
    } else {
      return "";
    }
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const otherUser = getOtherUser(selectedConv);

  return (
    <div className="messaging-container">
      <div className="messaging-gradient"></div>
      <div className="messaging-layout">
        {/* ── SIDEBAR CONTACTS ── */}
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
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
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
                return (
                  <div
                    key={conv.id}
                    className={`messaging-contact-item ${selectedConv?.id === conv.id ? "active" : ""}`}
                    onClick={() => selectConversation(conv)}
                  >
                    <div className="messaging-contact-avatar-wrapper">
                      <img
                        src={other.avatar}
                        alt={other.pseudo}
                        className="messaging-contact-avatar"
                      />
                      <span
                        className={`messaging-status-dot ${other.status === "online" ? "online" : "offline"}`}
                      />
                    </div>
                    <div className="messaging-contact-info">
                      <span className="messaging-contact-name">
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

        {/* ── ZONE DE CHAT ── */}
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
                    <span className="messaging-header-status">
                      {otherUser.status === "online"
                        ? "● En ligne"
                        : "○ Hors ligne"}
                    </span>
                  </div>
                </div>
                <div className="messaging-chat-actions">
                  <button className="messaging-action-btn" title="Rechercher">
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
                  <button
                    className="messaging-action-btn"
                    title="Plus d'options"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="12" cy="5" r="1"></circle>
                      <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                  </button>
                </div>
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
                    {messages.map((m) => {
                      // ✅ BUG 3 CORRIGÉ — comparaison String pour sent/received
                      const isMine = String(m.senderId) === myId;
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
                              {/* ✅ BUG 3 CORRIGÉ — formatTime gère tous les formats Firestore */}
                              <span className="messaging-message-time">
                                {formatTime(m.createdAt)}
                              </span>
                              {isMine && !m._pending && (
                                <div className="messaging-message-options">
                                  <button
                                    className="messaging-options-btn"
                                    onClick={() =>
                                      setActiveMenu(
                                        activeMenu === m.id ? null : m.id,
                                      )
                                    }
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                    >
                                      <circle cx="12" cy="12" r="2"></circle>
                                      <circle cx="12" cy="5" r="2"></circle>
                                      <circle cx="12" cy="19" r="2"></circle>
                                    </svg>
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
                <button type="button" className="messaging-attach-btn">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                  </svg>
                </button>
                <input
                  type="text"
                  className="messaging-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message…"
                />
                <button
                  type="submit"
                  className="messaging-send-btn"
                  disabled={!newMessage.trim() || sendLoading}
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
          onSelectConversation={(conv) => {
            setShowSearchModal(false);
            setConversations((prev) => {
              const exists = prev.find((c) => c.id === conv.id);
              if (exists) return prev;
              return [conv, ...prev];
            });
            selectConversation(conv);
          }}
        />
      )}
    </div>
  );
};

export default Messagerie;
