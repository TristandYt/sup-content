import React, { useState } from 'react';
import '../../../../Style/Styles.css';

const Login = ({ onSwitch, onLoginSuccess }) => {
  // ASTUCE : Mets des valeurs par défaut ici pour tester plus vite !
  const [email, setEmail] = useState('kiki@kiki.com'); 
  const [password, setPassword] = useState('kikiki');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    // .trim() retire les espaces inutiles
    if (!email.trim() || !password.trim()) {
      setError('Oups ! Il manque des informations pour se connecter.');
    } else {
      setError('');
      // On envoie les infos au parent (App.jsx)
      onLoginSuccess({
        pseudo: email.split('@')[0], 
        email: email
      });
    }
  };

  const handleSocialLogin = (platform) => {
    onLoginSuccess({ pseudo: platform + "_User", email: `${platform.toLowerCase()}@test.com` });
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Connexion</h2>
        
        {/* L'erreur ne s'affiche que s'il y en a une */}
        <div style={{ minHeight: '24px', marginBottom: '10px' }}>
            {error && <p style={errorStyle}>{error}</p>}
        </div>

        <input 
          style={inputStyle} 
          placeholder="Email ou Pseudo" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div style={{ position: 'relative', width: '100%' }}>
          <input 
            style={{ ...inputStyle, paddingRight: '50px' }} 
            type={showPass ? "text" : "password"} 
            placeholder="Mot de passe" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            // Permet de valider avec la touche "Entrée"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button type="button" onClick={() => setShowPass(!showPass)} style={eyeStyle}>
            {showPass ? '👁️' : '🙈'}
          </button>
        </div>

        <button onClick={handleLogin} style={btnMainStyle}>SE CONNECTER</button>

        <div style={dividerContainer}>
          <div style={line}></div>
          <span style={{ color: '#94a3b8', margin: '0 10px', fontSize: '14px' }}>Ou continuer avec</span>
          <div style={line}></div>
        </div>

        <div style={socialGroupStyle}>
          <button onClick={() => handleSocialLogin('Google')} style={socialBtnStyle} title="Google">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="24" alt="Google" />
          </button>
          <button onClick={() => handleSocialLogin('GitHub')} style={socialBtnStyle} title="GitHub">
            <img src="https://www.svgrepo.com/show/512317/github-142.svg" width="24" alt="GitHub" style={{ filter: 'invert(1)' }} />
          </button>
          <button onClick={() => handleSocialLogin('Meta')} style={socialBtnStyle} title="Meta">
            <img src="https://www.svgrepo.com/show/448224/facebook.svg" width="26" alt="Meta" />
          </button>
        </div>
        
        <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '25px' }}>
          Nouveau sur SUPCONTENT ? <span onClick={onSwitch} style={{ color: '#b208b4', cursor: 'pointer', fontWeight: 'bold' }}>Créer un compte</span>
        </p>
      </div>
    </div>
  );
};
export default Login;