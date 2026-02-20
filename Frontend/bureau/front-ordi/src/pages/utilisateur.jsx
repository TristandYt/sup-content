import React, { useState, useEffect } from 'react';
import '../../../../Style/Styles.css';
const Profile = ({ user, onLoginSuccess, onLogout }) => {
  // On initialise avec les données de l'utilisateur connecté s'il existe
  const [profileData, setProfileData] = useState({
    pseudo: user?.pseudo || 'kiki',
    email: user?.email || 'kiki@kiki.com',
    bio: user?.bio || 'kiki kiki kiki',
    lang: user?.lang || 'Français',
    avatar: user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Lucky'
  });

  // Si l'utilisateur change dans App.js, on met à jour ici
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({ ...prev, ...user }));
    }
  }, [user]);

  const handleChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileData({ ...profileData, avatar: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- FONCTION DE SAUVEGARDE ---
  const handleUpdate = () => {
    // On appelle onLoginSuccess pour mettre à jour l'état global dans App.js
    // Cela permet de "garder" la photo même si on change de page
    onLoginSuccess(profileData);
    alert('Profil et photo mis à jour avec succès !');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Mon Profil</h2>

        <div style={styles.avatarSection}>
          <div style={styles.avatarWrapper}>
            <img src={profileData.avatar} alt="Avatar" style={styles.avatarImg} />
            <label htmlFor="avatar-input" style={styles.editBadge}>
              ✏️
              <input 
                id="avatar-input" 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleAvatarChange} 
              />
            </label>
          </div>
          <p style={styles.infoText}>Identifié en tant que</p>
          <h3 style={styles.pseudoTitle}>{profileData.pseudo}</h3>
        </div>

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
          <select name="lang" style={styles.select} value={profileData.lang} onChange={handleChange}>
            <option value="Français">Français 🇫🇷</option>
            <option value="English">English 🇬🇧</option>
          </select>

          <label style={styles.label}>Email de contact</label>
          <input style={styles.disabledInput} value={profileData.email} disabled />

          {/* APPEL DE LA FONCTION handleUpdate ICI */}
          <button style={styles.btnSave} onClick={handleUpdate}>
            METTRE À JOUR LE PROFIL
          </button>

          <button style={styles.btnLogout} onClick={onLogout}>
            SE DÉCONNECTER
          </button>
        </div>
      </div>
    </div>
  );
};
export default Profile;