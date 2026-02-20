import React, { useState } from 'react';

const Login = ({ onSwitch, onLoginSuccess }) => {
  // ASTUCE : Mets des valeurs par défaut ici pour tester plus vite !
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
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
          <button onClick={() => handleSocialLogin('Facebook')} style={socialBtnStyle} title="Facebook">
            <img src="https://www.svgrepo.com/show/448224/facebook.svg" width="26" alt="Facebook" />
          </button>
        </div>
        
        <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '25px' }}>
          Nouveau sur SUPCONTENT ? <span onClick={onSwitch} style={{ color: '#b208b4', cursor: 'pointer', fontWeight: 'bold' }}>Créer un compte</span>
        </p>
      </div>
    </div>
  );
};

// --- STYLES (Inchangés mais regroupés pour la propreté) ---
const containerStyle = { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' };
const cardStyle = { backgroundColor: '#1e1e38', padding: '40px 50px', borderRadius: '25px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid #334155' };
const titleStyle = { textAlign: 'center', fontSize: '2rem', marginBottom: '20px', color: '#b208b4' };
const inputStyle = { width: '100%', padding: '16px', marginBottom: '20px', borderRadius: '12px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box', fontSize: '16px', outline: 'none' };
const btnMainStyle = { width: '100%', padding: '18px', background: '#b208b4', border: 'none', color: 'white', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.3s' };
const eyeStyle = { position: 'absolute', right: '15px', top: '23px', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' };
const errorStyle = { color: '#ff4444', textAlign: 'center', fontSize: '14px', margin: 0 };
const dividerContainer = { display: 'flex', alignItems: 'center', margin: '30px 0' };
const line = { flex: 1, height: '1px', background: '#334155' };
const socialGroupStyle = { display: 'flex', justifyContent: 'center', gap: '20px' };
const socialBtnStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '15px', border: '1px solid #334155', background: '#1e293b', cursor: 'pointer' };

export default Login;