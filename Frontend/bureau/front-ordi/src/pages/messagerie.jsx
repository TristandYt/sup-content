import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../../Style/Styles.css";

const Messagerie = ({ user }) => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  // Cet objet stocke toutes les conversations : { "id_contact": [messages...] }
  const [allConversations, setAllConversations] = useState({});

  const messagesEndRef = useRef(null);

  // 1. Charger les contacts et les anciens messages au démarrage
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

    // Charger les messages sauvegardés dans le navigateur
    const savedChats = localStorage.getItem(`chats_${user?.email}`);
    if (savedChats) {
      setAllConversations(JSON.parse(savedChats));
    }
  }, [user]);

  // 2. Scroll automatique vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedContact, allConversations]);

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

    // MISE À JOUR DE LA CONVERSATION SPÉCIFIQUE
    const contactId = selectedContact.id;
    const updatedConversations = {
      ...allConversations,
      [contactId]: [...(allConversations[contactId] || []), msg],
    };

    setAllConversations(updatedConversations);
    setNewMessage("");

    // Sauvegarde locale (pour simuler une base de données)
    localStorage.setItem(
      `chats_${user?.email}`,
      JSON.stringify(updatedConversations),
    );
  };

  // On récupère uniquement les messages de la personne sélectionnée
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
                    className={`message-bubble ${m.senderId === user.id ? "me" : "them"}`}
                  >
                    <p>{m.text}</p>
                    <span className="chat-time">{m.time}</span>
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
                <button type="submit" className="btn-send">
                  {/* Icône avion en papier comme demandé */}
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
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
