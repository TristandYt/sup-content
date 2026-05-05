import React, { useState } from 'react';

const Login = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      setError('Champ incomplet');
    } else {
      setError('');
      console.log("Tentative de connexion...");
    }
  };

  const handleSocialLogin = (platform) => {
    console.log(`Connexion avec ${platform} lancée...`);
  };

  return (
    <div style={styles.mainWrapper}>
      {error && <p style={styles.errorText}>{error}</p>}
      
      <h2 style={styles.title}>Connexion</h2>

      <input 
        style={styles.input} 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="Email ou pseudo" 
      />

      <div style={styles.rel}>
        <input 
          style={{ ...styles.input, marginBottom: 0, paddingRight: '50px' }} 
          type={showPassword ? "text" : "password"} 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Mot de passe" 
        />
        <button 
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={styles.eyeBtn}
        >
          {showPassword ? '👁️' : '🙈'} 
        </button>
      </div>

      <button onClick={handleLogin} style={styles.btnPrimary}>SE CONNECTER</button>

      {/* --- SÉPARATEUR --- */}
      <div style={styles.dividerContainer}>
        <div style={styles.line}></div>
        <span style={styles.dividerText}>Ou continuer avec</span>
        <div style={styles.line}></div>
      </div>

      {/* --- BOUTONS SOCIAUX --- */}
      <div style={styles.socialGroup}>
        <button onClick={() => handleSocialLogin('Google')} style={styles.socialBtn} title="Google">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="24" alt="Google" />
        </button>
        <button onClick={() => handleSocialLogin('GitHub')} style={styles.socialBtn} title="GitHub">
          <img src="https://www.svgrepo.com/show/512317/github-142.svg" width="24" alt="GitHub" style={{ filter: 'invert(1)' }} />
        </button>
        <button onClick={() => handleSocialLogin('Meta')} style={styles.socialBtn} title="Meta">
          <img src="https://www.svgrepo.com/show/448224/facebook.svg" width="28" alt="Meta" />
        </button>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          Nouveau sur SUPCONTENT ? <span onClick={onSwitch} style={styles.link}>Créer un compte</span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  mainWrapper: {
    marginTop: '30px',
    width: '100%'
  },
  title: { 
    textAlign: 'center', 
    fontSize: '2rem', 
    marginBottom: '30px', 
    color: '#b208b4' 
  },
  input: { 
    width: '100%', 
    padding: '14px', 
    borderRadius: '10px', 
    background: '#0f172a', 
    color: 'white', 
    border: '2px solid #334155', 
    boxSizing: 'border-box', 
    marginBottom: '15px', 
    fontSize: '16px',
    outline: 'none'
  },
  rel: { 
    position: 'relative', 
    marginBottom: '15px' 
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnPrimary: { 
    width: '100%', 
    backgroundColor: '#b208b4', 
    color: 'white', 
    padding: '16px', 
    borderRadius: '12px', 
    border: 'none', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    fontSize: '16px',
    marginTop: '10px'
  },
  dividerContainer: { 
    display: 'flex', 
    alignItems: 'center', 
    margin: '30px 0' 
  },
  line: { 
    flex: 1, 
    height: '1px', 
    background: '#334155' 
  },
  dividerText: { 
    color: '#94a3b8', 
    margin: '0 10px', 
    fontSize: '14px' 
  },
  socialGroup: { 
    display: 'flex', 
    justifyContent: 'center', 
    gap: '20px' 
  },
  socialBtn: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '60px', 
    height: '60px', 
    borderRadius: '15px', 
    border: '1px solid #334155', 
    background: '#1e293b', 
    cursor: 'pointer', 
    transition: 'all 0.2s ease' 
  },
  errorText: { 
    color: '#ff4444', 
    textAlign: 'center', 
    fontSize: '14px',
    marginBottom: '10px'
  },
  footer: { 
    textAlign: 'center', 
    marginTop: '30px' 
  },
  footerText: { 
    color: '#94a3b8', 
    fontSize: '15px' 
  },
  link: { 
    color: '#b208b4', 
    cursor: 'pointer', 
    fontWeight: 'bold' 
  }
};

export default Login;