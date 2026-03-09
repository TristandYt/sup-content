import React, { useState } from 'react';
import '../../../../Style/Styles.css';

const Register = ({ onSwitch }) => {
  const [formData, setFormData] = useState({ pseudo: '', email: '', pass: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateForm = () => {
    const { pseudo, email, pass, confirm } = formData;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!pseudo || !email || !pass || !confirm) return "Tous les champs sont obligatoires";
    if (!emailRegex.test(email)) return "L'adresse email n'est pas valide";
    if (pass.length < 8) return "Le mot de passe doit contenir au moins 8 caractères";
    if (pass !== confirm) return "Les mots de passe ne correspondent pas";
    
    return null;
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      console.log("Envoi des données :", formData);
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert("Compte créé avec succès !");
    } catch (err) {
      setError("Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialRegister = (platform) => {
    console.log(`Redirection vers l'authentification ${platform}...`);
  };

  // Composant interne pour l'icône d'œil (SVG)
  const EyeIcon = ({ open }) => (
    open ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
    )
  );

  return (
    <div className="container">
      <div className="card">
        <h2 className="title">Rejoindre la communauté</h2>
        
        <div className="error-msg" style={{ minHeight: '20px', color: '#ff4d4d', fontSize: '0.9rem', marginBottom: '10px' }}>
            {error && error}
        </div>

        <div className="form-group">
          <label className="label-text">Pseudo</label>
          <input 
            name="pseudo" 
            className="input-field" 
            placeholder="Ton pseudo" 
            onChange={handleChange} 
            disabled={isLoading}
          />

          <label className="label-text">Adresse Email</label>
          <input 
            name="email" 
            type="email"
            className="input-field" 
            placeholder="email@exemple.com" 
            onChange={handleChange} 
            disabled={isLoading}
          />
          
          <label className="label-text">Mot de passe</label>
          <div className="password-container">
            <input 
              name="pass" 
              type={showPass ? "text" : "password"} 
              className="input-field" 
              placeholder="••••••••" 
              onChange={handleChange} 
              disabled={isLoading}
            />
            <button onClick={() => setShowPass(!showPass)} className="eye-button" type="button" style={{ opacity: 0.7 }}>
              <EyeIcon open={showPass} />
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
              disabled={isLoading}
            />
            <button onClick={() => setShowConfirm(!showConfirm)} className="eye-button" type="button" style={{ opacity: 0.7 }}>
              <EyeIcon open={showConfirm} />
            </button>
          </div>
        </div>

        <button 
          onClick={handleRegister} 
          className={`btn-main ${isLoading ? 'btn-disabled' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'INSCRIPTION EN COURS...' : 'CRÉER MON COMPTE'}
        </button>

        <div className="divider">
          <div className="divider-line"></div>
          <span className="divider-text">Ou s'inscrire avec</span>
          <div className="divider-line"></div>
        </div>

        <div className="social-group">
          <button onClick={() => handleSocialRegister('Google')} className="social-btn" title="Google" disabled={isLoading}>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="22" alt="Google" />
          </button>
          <button onClick={() => handleSocialRegister('GitHub')} className="social-btn" title="GitHub" disabled={isLoading}>
            <img src="https://www.svgrepo.com/show/512317/github-142.svg" width="22" alt="GitHub" style={{ filter: 'invert(1)' }} />
          </button>
          <button onClick={() => handleSocialRegister('Facebook')} className="social-btn" title="Facebook" disabled={isLoading}>
            <img src="https://www.svgrepo.com/show/448224/facebook.svg" width="26" alt="Facebook" />
          </button>
        </div>

        {/* Section remise en place comme demandé */}
        <p className="footer-text">
          Déjà inscrit ? <span onClick={!isLoading ? onSwitch : null} className="link-highlight" style={{ cursor: 'pointer' }}>Se connecter</span>
        </p>
      </div>
    </div>
  );
};

export default Register;