import React, { useState } from 'react';
import '../../../../Style/Styles.css';

const Login = ({ onSwitch, onLoginSuccess }) => {
  const [email, setEmail] = useState('kiki@kiki.com'); 
  const [password, setPassword] = useState('kikiki');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError('Oups ! Il manque des informations pour se connecter.');
    } else {
      setError('');
      // On vérifie que la fonction existe avant de l'appeler pour éviter un crash
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess({
          pseudo: email.includes('@') ? email.split('@')[0] : email, 
          email: email
        });
      }
    }
  };

  const handleSocialLogin = (platform) => {
    if (typeof onLoginSuccess === 'function') {
      onLoginSuccess({ 
        pseudo: platform + "_User", 
        email: `${platform.toLowerCase()}@test.com` 
      });
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="title">Connexion</h2>
        
        {/* Affichage de l'erreur */}
        <div className="error-msg">
            {error && error}
        </div>

        <div className="form-group">
          <label className="label-text">Email ou Pseudo</label>
          <input 
            className="input-field" 
            placeholder="Ex: kiki@mail.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="label-text">Mot de passe</label>
          <div className="password-container">
            <input 
              className="input-field" 
              type={showPass ? "text" : "password"} 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="eye-button">
              {showPass ? '👁️' : '🙈'}
            </button>
          </div>
        </div>

        <button onClick={handleLogin} className="btn-main">SE CONNECTER</button>

        <div className="divider">
          <div className="divider-line"></div>
          <span className="divider-text">Ou continuer avec</span>
          <div className="divider-line"></div>
        </div>

        <div className="social-group">
          <button onClick={() => handleSocialLogin('Google')} className="social-btn" title="Google">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="24" alt="Google" />
          </button>
          <button onClick={() => handleSocialLogin('GitHub')} className="social-btn" title="GitHub">
            <img src="https://www.svgrepo.com/show/512317/github-142.svg" width="24" alt="GitHub" style={{ filter: 'invert(1)' }} />
          </button>
          <button onClick={() => handleSocialLogin('Meta')} className="social-btn" title="Meta">
            <img src="https://www.svgrepo.com/show/448224/facebook.svg" width="26" alt="Meta" />
          </button>
        </div>
        
        <p className="footer-text">
          Nouveau sur SUPCONTENT ? <span onClick={onSwitch} className="link-highlight">Créer un compte</span>
        </p>
      </div>
    </div>
  );
};

export default Login;