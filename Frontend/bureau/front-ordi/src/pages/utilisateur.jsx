import React, { useState, useEffect } from 'react';

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

// ... (Garder les mêmes styles qu'avant)
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: '#0f172a', padding: '20px' },
  card: { backgroundColor: '#252545', padding: '40px', borderRadius: '25px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid #334155' },
  title: { textAlign: 'center', fontSize: '1.8rem', marginBottom: '30px', color: '#b208b4' },
  avatarSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' },
  avatarWrapper: { position: 'relative', width: '110px', height: '110px', borderRadius: '50%', border: '3px solid #b208b4', padding: '4px', background: '#0f172a' },
  avatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  editBadge: { position: 'absolute', bottom: '5px', right: '5px', background: '#b208b4', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px' },
  infoText: { color: '#94a3b8', fontSize: '12px', marginBottom: '5px', marginTop: '15px', textTransform: 'uppercase' },
  pseudoTitle: { color: 'white', fontSize: '1.4rem', margin: 0 },
  form: { display: 'flex', flexDirection: 'column' },
  label: { color: '#94a3b8', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' },
  textarea: { width: '100%', padding: '14px', borderRadius: '12px', background: '#0f172a', color: 'white', border: '2px solid #334155', boxSizing: 'border-box', marginBottom: '20px', fontSize: '15px', outline: 'none', minHeight: '80px', resize: 'none', fontFamily: 'inherit' },
  select: { width: '100%', padding: '14px', borderRadius: '12px', background: '#0f172a', color: 'white', border: '2px solid #334155', boxSizing: 'border-box', marginBottom: '25px', fontSize: '15px', outline: 'none', cursor: 'pointer' },
  disabledInput: { width: '100%', padding: '14px', borderRadius: '12px', background: '#1a1a2e', color: '#64748b', border: '2px solid #334155', boxSizing: 'border-box', marginBottom: '30px', fontSize: '15px', cursor: 'not-allowed' },
  btnSave: { width: '100%', padding: '16px', backgroundColor: '#b208b4', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },
  btnLogout: { marginTop: '15px', background: 'none', border: '1px solid #ff4444', color: '#ff4444', padding: '10px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Profile;