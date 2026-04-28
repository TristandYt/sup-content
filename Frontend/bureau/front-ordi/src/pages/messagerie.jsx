import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "../../Style/Styles.css";

const Messagerie = ({ user }) => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [allConversations, setAllConversations] = useState({});
  const [activeMenu, setActiveMenu] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Simulation de contacts
    setContacts([
      {
        id: 101,
        pseudo: "Gamer_X",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Gamer",
        status: "online",
      },
      {
        id: 102,
        pseudo: "PixelArt",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Pixel",
        status: "online",
      },
      {
        id: 103,
        pseudo: "ProPlayer",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Pro",
        status: "offline",
      },
      {
        id: 104,
        pseudo: "NinjaGamer",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Ninja",
        status: "online",
      },
    ]);

    const savedChats = localStorage.getItem(`chats_${user?.email}`);
    if (savedChats) {
      setAllConversations(JSON.parse(savedChats));
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedContact, allConversations]);

  const saveAndSetConversations = (updated) => {
    setAllConversations(updated);
    localStorage.setItem(`chats_${user?.email}`, JSON.stringify(updated));
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    const msg = {
      id: Date.now(),
      senderId: user.id,
      text: newMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const contactId = selectedContact.id;
    const updated = {
      ...allConversations,
      [contactId]: [...(allConversations[contactId] || []), msg],
    };
    saveAndSetConversations(updated);
    setNewMessage("");
  };

  const deleteMessage = (messageId) => {
    const contactId = selectedContact.id;
    const updatedMessages = allConversations[contactId].filter(
      (m) => m.id !== messageId,
    );
    saveAndSetConversations({
      ...allConversations,
      [contactId]: updatedMessages,
    });
    setActiveMenu(null);
  };

  const editMessage = (messageId) => {
    const contactId = selectedContact.id;
    const msgToEdit = allConversations[contactId].find(
      (m) => m.id === messageId,
    );
    const newText = prompt("Modifier votre message :", msgToEdit.text);

    if (newText && newText.trim() !== "") {
      const updatedMessages = allConversations[contactId].map((m) =>
        m.id === messageId ? { ...m, text: newText } : m,
      );
      saveAndSetConversations({
        ...allConversations,
        [contactId]: updatedMessages,
      });
    }
    setActiveMenu(null);
  };

  const currentMessages = selectedContact
    ? allConversations[selectedContact.id] || []
    : [];

  return (
    <div className="messaging-container">
      <div className="messaging-gradient"></div>

      <div className="messaging-layout">
        {/* SIDEBAR : LISTE DES CONTACTS */}
        <aside className="messaging-sidebar">
          <div className="messaging-sidebar-header">
            <div className="messaging-header-content">
              <div className="messaging-icon">💬</div>
              <h3 className="messaging-title">Messages</h3>
            </div>
            <button className="messaging-new-btn" title="Nouveau message">
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
            {contacts.map((c) => (
              <div
                key={c.id}
                className={`messaging-contact-item ${selectedContact?.id === c.id ? "active" : ""}`}
                onClick={() => setSelectedContact(c)}
              >
                <div className="messaging-contact-avatar-wrapper">
                  <img
                    src={c.avatar}
                    alt={c.pseudo}
                    className="messaging-contact-avatar"
                  />
                  <span
                    className={`messaging-status-dot ${c.status === "online" ? "online" : "offline"}`}
                  ></span>
                </div>
                <div className="messaging-contact-info">
                  <span className="messaging-contact-name">{c.pseudo}</span>
                  <span className="messaging-contact-status">
                    {c.status === "online" ? "En ligne" : "Hors ligne"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN : ZONE DE CHAT */}
        <main className="messaging-main">
          {selectedContact ? (
            <>
              {/* En-tête du chat */}
              <div className="messaging-chat-header">
                <div className="messaging-chat-header-info">
                  <img
                    src={selectedContact.avatar}
                    alt={selectedContact.pseudo}
                    className="messaging-header-avatar"
                  />
                  <div>
                    <h4 className="messaging-header-name">
                      {selectedContact.pseudo}
                    </h4>
                    <span className="messaging-header-status">
                      {selectedContact.status === "online"
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

              {/* Zone des messages */}
              <div className="messaging-messages-area">
                {currentMessages.length === 0 ? (
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
                    {currentMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`messaging-message ${m.senderId === user.id ? "sent" : "received"}`}
                      >
                        {m.senderId !== user.id && (
                          <img
                            src={selectedContact.avatar}
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
                              {m.time}
                            </span>
                            {m.senderId === user.id && (
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
                                      onClick={() => editMessage(m.id)}
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
                                      onClick={() => deleteMessage(m.id)}
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
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Zone de saisie */}
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
                  placeholder="Écrivez votre message..."
                />
                <button
                  type="submit"
                  className="messaging-send-btn"
                  disabled={!newMessage.trim()}
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
                  Choisissez un contact dans la liste pour commencer à discuter
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Messagerie;
