import React, { useState, useEffect } from 'react';

// On récupère 'user' et 'onLogout' depuis les props passées par App.jsx
const Profile = ({ user, onLogout }) => {
  const [profileData, setProfileData] = useState({
    pseudo: 'kiki',
    email: 'kiki@kiki.com',
    bio: 'kiki kiki kiki',
    lang: 'Français',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Lucky'
  });

  // On synchronise les données reçues à la connexion avec l'état du profil
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        pseudo: user.pseudo,
        email: user.email,
        // Tu peux aussi changer le seed de l'avatar selon le pseudo !
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.pseudo}`
      }));
    }
  }, [user]);

  const handleChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Mon Profil</h2>

        {/* --- SECTION AVATAR --- */}
        <div style={styles.avatarSection}>
          <div style={styles.avatarWrapper}>
            <img src={profileData.avatar} alt="Avatar" style={styles.avatarImg} />
            <label htmlFor="avatar-input" style={styles.editBadge}>
              ✏️
              <input id="avatar-input" type="file" style={{ display: 'none' }} />
            </label>
          </div>
          <p style={styles.infoText}>Identifié en tant que</p>
          <h3 style={styles.pseudoTitle}>{profileData.pseudo}</h3>
        </div>

        {/* --- FORMULAIRE --- */}
        <div style={styles.form}>
          
          <label style={styles.label}>Ma Biographie</label>
          <textarea 
            name="bio"
            style={styles.textarea} 
            value={profileData.bio} 
            onChange={handleChange}
            placeholder="Écrivez quelques mots sur vous..."
          />

          <label style={styles.label}>Langue de l'interface</label>
          <select 
            name="lang"
            style={styles.select} 
            value={profileData.lang} 
            onChange={handleChange}
          >
            <option value="Français">Français 🇫🇷</option>
            <option value="English">English 🇬🇧</option>
          </select>

          <label style={styles.label}>Email de contact</label>
          <input 
            style={styles.disabledInput} 
            value={profileData.email} 
            disabled 
          />

          <button style={styles.btnSave} onClick={() => alert('Changements enregistrés !')}>
            METTRE À JOUR LE PROFIL
          </button>

          {/* Bouton de déconnexion ajouté pour la navigation */}
          <button style={styles.btnLogout} onClick={onLogout}>
            SE DÉCONNECTER
          </button>
        </div>
      </div>
    </div>
  );
};



export default Profile;