import React, { useState, useEffect } from 'react';
import '../../../../Style/Styles.css';

const Profile = ({ user, onLoginSuccess, onLogout }) => {
  // Initialisation avec les données de l'utilisateur
  const [profileData, setProfileData] = useState({
    pseudo: user?.pseudo || 'kiki',
    email: user?.email || 'kiki@kiki.com',
    bio: user?.bio || '',
    lang: user?.lang || 'Français',
    avatar: user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Lucky'
  });

  // Mise à jour si l'utilisateur change dans l'état global
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

  const handleUpdate = () => {
    if (onLoginSuccess) {
      onLoginSuccess(profileData);
      alert('Profil et photo mis à jour avec succès !');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="title" style={{ color: 'var(--white)' }}>Mon Profil</h2>

        {/* Section Avatar utilisant tes classes CSS */}
        <div className="avatar-section">
          <div className="avatar-wrapper">
            <img src={profileData.avatar} alt="Avatar" className="avatar-img" />
            <label htmlFor="avatar-input" className="edit-badge">
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
          <p className="footer-text" style={{ marginTop: '10px', marginBottom: '5px' }}>Identifié en tant que</p>
          <h3 className="title" style={{ fontSize: '1.5rem', marginBottom: '0' }}>{profileData.pseudo}</h3>
        </div>

        <div className="form-group">
          <label className="label-text">Ma Biographie</label>
          <textarea 
            name="bio"
            className="input-field textarea" 
            value={profileData.bio} 
            onChange={handleChange}
            placeholder="Écrivez quelques mots sur vous..."
          />

          <label className="label-text">Langue de l'interface</label>
          <select 
            name="lang" 
            className="input-field" 
            value={profileData.lang} 
            onChange={handleChange}
            style={{ appearance: 'none' }}
          >
            <option value="Français">Français 🇫🇷</option>
            <option value="English">English 🇬🇧</option>
          </select>

          <label className="label-text">Email de contact</label>
          <input className="input-field input-disabled" value={profileData.email} disabled />

          <button className="btn-save" onClick={handleUpdate}>
            METTRE À JOUR LE PROFIL
          </button>

          <button className="btn-logout" onClick={onLogout}>
            SE DÉCONNECTER
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;