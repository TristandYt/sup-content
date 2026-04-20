import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../../Style/Styles.css";

const Messagerie = ({ user }) => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll automatique vers le bas lors d'un nouveau message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Charger la liste des amis (ceux qu'on suit)
  useEffect(() => {
    const fetchContacts = async () => {
      if (!user?.id) return;
      try {
        // Remplace par ton endpoint réel qui récupère les abonnements
        const res = await axios.get(
          `http://localhost:3000/api/user/following/${user.id}`,
        );
        setContacts(res.data);
      } catch (err) {
        console.error("Erreur contacts:", err);
        // Mock data pour test si serveur déconnecté
        setContacts([
          {
            id: 101,
            pseudo: "GamerPro",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Gamer",
          },
          {
            id: 102,
            pseudo: "LuckyPlayer",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Lucky",
          },
        ]);
      }
    };
    fetchContacts();
  }, [user]);

  // Charger les messages quand on sélectionne un contact
  useEffect(() => {
    if (selectedContact) {
      const fetchMessages = async () => {
        try {
          const res = await axios.get(
            `http://localhost:3000/api/messages/${user.id}/${selectedContact.id}`,
          );
          setMessages(res.data);
        } catch (err) {
          setMessages([
            {
              id: 1,
              senderId: selectedContact.id,
              text: `Salut ! Prêt pour une partie ?`,
              time: "10:00",
            },
            {
              id: 2,
              senderId: user.id,
              text: `Carrément, j'arrive !`,
              time: "10:05",
            },
          ]);
        }
      };
      fetchMessages();
    }
  }, [selectedContact, user.id]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    const msgObj = {
      id: Date.now(),
      senderId: user.id,
      text: newMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, msgObj]);
    setNewMessage("");

    // Logique API pour sauvegarder le message
    // axios.post('http://localhost:3000/api/messages/send', { from: user.id, to: selectedContact.id, text: newMessage });
  };

  return (
    <div className="chat-page-container">
      <div className="chat-layout">
        {/* COLONNE GAUCHE : LISTE DES CONTACTS */}
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h3>Discussions</h3>
          </div>
          <div className="contacts-list">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={`contact-item ${selectedContact?.id === contact.id ? "active" : ""}`}
                onClick={() => setSelectedContact(contact)}
              >
                <img
                  src={contact.avatar}
                  alt="Avatar"
                  className="contact-avatar"
                />
                <div className="contact-info">
                  <span className="contact-name">{contact.pseudo}</span>
                  <span className="contact-status">En ligne</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLONNE DROITE : ZONE DE CHAT */}
        <div className="chat-main">
          {selectedContact ? (
            <>
              <div className="chat-header">
                <img
                  src={selectedContact.avatar}
                  alt=""
                  className="contact-avatar-small"
                />
                <h4>{selectedContact.pseudo}</h4>
              </div>

              <div className="chat-messages">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-bubble ${msg.senderId === user.id ? "me" : "them"}`}
                  >
                    <p>{msg.text}</p>
                    <span className="message-time">{msg.time}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Écrivez votre message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn-send">
                  ➤
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty-state">
              <p>Sélectionnez un ami pour commencer à discuter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messagerie;
