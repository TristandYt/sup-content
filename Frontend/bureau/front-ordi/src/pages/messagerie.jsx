import React, { useState, useEffect, useRef } from "react";
import "../../Style/Styles.css";

const Messagerie = ({ user }) => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [allConversations, setAllConversations] = useState({});

  // État pour gérer l'affichage du menu d'options sur un message
  const [activeMenu, setActiveMenu] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
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

  // --- NOUVELLES FONCTIONS : SUPPRIMER ET MODIFIER ---

  const deleteMessage = (messageId) => {
    const contactId = selectedContact.id;
    const updatedMessages = allConversations[contactId].filter(
      (m) => m.id !== messageId,
    );
    const updatedConversations = {
      ...allConversations,
      [contactId]: updatedMessages,
    };
    saveAndSetConversations(updatedConversations);
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
    <div className="chat-page-container">
      <div className="chat-layout">
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h3>Messages</h3>
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
                  <span className="contact-status">En ligne</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-main">
          {selectedContact ? (
            <>
              <div className="chat-header">
                <h4>{selectedContact.pseudo}</h4>
              </div>
              <div className="chat-messages">
                {currentMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`message-container ${m.senderId === user.id ? "me" : "them"}`}
                  >
                    <div className="message-bubble">
                      <p>{m.text}</p>
                      <div className="message-footer">
                        <span className="chat-time">{m.time}</span>
                        {/* Menu trois points uniquement pour mes messages */}
                        {m.senderId === user.id && (
                          <div className="message-options">
                            <button
                              className="dots-btn"
                              onClick={() =>
                                setActiveMenu(activeMenu === m.id ? null : m.id)
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

              <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez..."
                />
                <button type="submit" className="btn-send-large">
                  <svg
                    viewBox="0 0 24 24"
                    width="28"
                    height="28"
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
              Sélectionne un ami pour discuter
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messagerie;
