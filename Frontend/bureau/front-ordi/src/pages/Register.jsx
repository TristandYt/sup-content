import React, { useState } from 'react';
import '../../../../Style/Styles.css';

const Register = ({ onSwitch }) => {
  const [formData, setFormData] = useState({ pseudo: '', email: '', pass: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = () => {
    const { pseudo, email, pass, confirm } = formData;
    if (!pseudo || !email || !pass || !confirm) {
      setError('Tous les champs sont obligatoires');
    } else if (pass !== confirm) {
      setError('Les mots de passe ne correspondent pas');
    } else {
      setError('');
      alert("Compte créé avec succès !");
    }
  };

  const handleSocialRegister = (platform) => {
    console.log(`Inscription via ${platform}...`);
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="title">Rejoindre la communauté</h2>
        
        <div className="error-msg">
            {error && error}
        </div>

        <div className="form-group">
          <label className="label-text">Pseudo</label>
          <input 
            name="pseudo" 
            className="input-field" 
            placeholder="Ton pseudo" 
            onChange={handleChange} 
          />

          <label className="label-text">Adresse Email</label>
          <input 
            name="email" 
            className="input-field" 
            placeholder="email@exemple.com" 
            onChange={handleChange} 
          />
          
          <label className="label-text">Mot de passe</label>
          <div className="password-container">
            <input 
              name="pass" 
              type={showPass ? "text" : "password"} 
              className="input-field" 
              placeholder="••••••••" 
              onChange={handleChange} 
            />
            <button onClick={() => setShowPass(!showPass)} className="eye-button">
              {showPass ? '👁️' : '🙈'}
            </button>
          </div>

          <label className="label-text">Confirmer le mot de passe</label>
          <div className="password-container">
            <input 
              name="confirm" 
              type={showConfirm ? "text" : "password"} 
              className="input-field" 
              placeholder="••••••••" 
              onChange={handleChange} 
            />
            <button onClick={() => setShowConfirm(!showConfirm)} className="eye-button">
              {showConfirm ? '👁️' : '🙈'}
            </button>
          </div>
        </div>

        <button onClick={handleRegister} className="btn-main">CRÉER MON COMPTE</button>

        <div className="divider">
          <div className="divider-line"></div>
          <span className="divider-text">Ou s'inscrire avec</span>
          <div className="divider-line"></div>
        </div>

        <div className="social-group">
          <button onClick={() => handleSocialRegister('Google')} className="social-btn" title="Google">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="22" alt="Google" />
          </button>
          <button onClick={() => handleSocialRegister('GitHub')} className="social-btn" title="GitHub">
            <img src="https://www.svgrepo.com/show/512317/github-142.svg" width="22" alt="GitHub" style={{ filter: 'invert(1)' }} />
          </button>
          <button onClick={() => handleSocialRegister('Facebook')} className="social-btn" title="Facebook">
            <img src="https://www.svgrepo.com/show/448224/facebook.svg" width="26" alt="Facebook" />
          </button>
        </div>

        <p className="footer-text">
          Déjà inscrit ? <span onClick={onSwitch} className="link-highlight">Se connecter</span>
        </p>
      </div>
    </div>
  );
};

export default Register;