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
      },
      {
        id: 102,
        pseudo: "PixelArt",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Pixel",
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
    <div className="app-container">
      {/* Effet visuel d'arrière-plan */}
      <div className="hero-gradient"></div>

      <div className="chat-page-container">
        <div className="chat-layout">
          {/* SIDEBAR : LISTE DES CONTACTS */}
          <div className="chat-sidebar">
            <div className="sidebar-header">
              <h3
                className="hero-title"
                style={{ fontSize: "1.5rem", textAlign: "left" }}
              >
                Messages
              </h3>
            </div>
            <div className="contacts-list">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className={`contact-item ${selectedContact?.id === c.id ? "active" : ""}`}
                  onClick={() => setSelectedContact(c)}
                >
                  <img src={c.avatar} alt="" className="contact-avatar" />
                  <div className="contact-info">
                    <span className="contact-name">{c.pseudo}</span>
                    <span className="contact-status">● En ligne</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MAIN : ZONE DE CHAT */}
          <div className="chat-main">
            {selectedContact ? (
              <>
                <div className="chat-header">
                  <h4 className="game-title" style={{ margin: 0 }}>
                    {selectedContact.pseudo}
                  </h4>
                </div>

                <div className="chat-messages">
                  {currentMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`message-container ${m.senderId === user.id ? "me" : "them"}`}
                    >
                      <div className="message-bubble">
                        <p style={{ margin: 0 }}>{m.text}</p>
                        <div className="message-footer">
                          <span className="chat-time">{m.time}</span>

                          {/* Menu d'options pour l'utilisateur actuel */}
                          {m.senderId === user.id && (
                            <div className="message-options">
                              <button
                                className="dots-btn"
                                onClick={() =>
                                  setActiveMenu(
                                    activeMenu === m.id ? null : m.id,
                                  )
                                }
                              >
                                ⋮
                              </button>
                              {activeMenu === m.id && (
                                <div className="options-menu">
                                  <button onClick={() => editMessage(m.id)}>
                                    Modifier
                                  </button>
                                  <button
                                    onClick={() => deleteMessage(m.id)}
                                    className="delete-opt"
                                  >
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
                </div>

                {/* ZONE DE SAISIE */}
                <form className="chat-input-area" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    className="search-input-modern"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      padding: "12px 20px",
                      borderRadius: "25px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                  />
                  <button type="submit" className="btn-send-large">
                    <svg
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
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
              <div className="chat-empty-state">
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "3rem",
                      marginBottom: "1rem",
                      opacity: 0.3,
                    }}
                  >
                    💬
                  </div>
                  <p className="hero-subtitle">
                    Sélectionnez une conversation pour commencer
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messagerie;
