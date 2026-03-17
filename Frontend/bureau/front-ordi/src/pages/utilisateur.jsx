import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import "../Style/Styles.css";

const Profile = ({ user, onLoginSuccess, onLogout }) => {
  const { t, i18n } = useTranslation();

  const [profileData, setProfileData] = useState({
    pseudo: user?.pseudo || 'kiki',
    email: user?.email || 'kiki@kiki.com',
    bio: user?.bio || '',
    avatar: user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Lucky'
  });

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({ ...prev, ...user }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si on change la langue, on informe i18next immédiatement
    if (name === 'lang') {
      i18n.changeLanguage(value);
    } else {
      setProfileData({ ...profileData, [name]: value });
    }
  };

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
      alert(t('alertSuccess'));
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="title" style={{ color: 'var(--white)' }}>{t('profileTitle')}</h2>

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
          <p className="footer-text" style={{ marginTop: '10px', marginBottom: '5px' }}>{t('identifiedAs')}</p>
          <h3 className="title" style={{ fontSize: '1.5rem', marginBottom: '0' }}>{profileData.pseudo}</h3>
        </div>

        <div className="form-group">
          <label className="label-text">{t('bioLabel')}</label>
          <textarea 
            name="bio"
            className="input-field textarea" 
            value={profileData.bio} 
            onChange={handleChange}
            placeholder={t('placeholderBio')}
          />

          <label className="label-text">{t('langLabel')}</label>
          <select 
            name="lang" 
            className="input-field" 
            value={i18n.language} // Connecté à la langue actuelle de i18n
            onChange={handleChange}
            style={{ appearance: 'none' }}
          >
            <option value="Français">Français 🇫🇷</option>
            <option value="English">English 🇬🇧</option>
          </select>

          <label className="label-text">{t('emailLabel')}</label>
          <input className="input-field input-disabled" value={profileData.email} disabled />

          <button className="btn-save" onClick={handleUpdate}>
            {t('btnUpdate')}
          </button>

          <button className="btn-logout" onClick={onLogout}>
            {t('btnLogout')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;