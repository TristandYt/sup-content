import React, { useState } from 'react';

const Login = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // État pour l'œil
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      setError('Champ incomplet');
    } else {
      setError('');
      console.log("Tentative de connexion...");
    }
  };

  return (
    <div style={{ marginTop: '30px' }}>
      {error && <p style={{ color: '#ff4444', textAlign: 'center', fontSize: '14px' }}>{error}</p>}

      <input 
        style={styles.input} 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="Email ou pseudo" 
      />

      {/* Conteneur pour le mot de passe avec l'œil */}
      <div style={{ position: 'relative', marginBottom: '15px' }}>
        <input 
          style={{ ...styles.input, marginBottom: 0 }} 
          type={showPassword ? "text" : "password"} // Bascule le type ici
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

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button onClick={onSwitch} style={styles.btnOutline}>CRÉER UN COMPTE</button>
      </div>
    </div>
  );
};

const styles = {
  input: { 
    width: '100%', padding: '14px', borderRadius: '10px', 
    background: '#0f172a', color: 'white', border: '2px solid #334155', 
    boxSizing: 'border-box', marginBottom: '15px', fontSize: '16px' 
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
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnPrimary: { 
    width: '100%', backgroundColor: '#b208b4', color: 'white', 
    padding: '16px', borderRadius: '12px', border: 'none', 
    fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' 
  },
  btnOutline: { 
    background: 'none', border: '2px solid #b208b4', color: '#b208b4', 
    padding: '12px 30px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' 
  }
};

export default Login;