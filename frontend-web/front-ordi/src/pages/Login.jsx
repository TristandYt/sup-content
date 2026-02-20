import React, { useState } from 'react';

const Login = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#252545', padding: '50px', borderRadius: '25px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '30px', color: '#b208b4' }}>Connexion</h2>
        
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
          />
          <button onClick={() => setShowPass(!showPass)} style={eyeStyle}>
            {showPass ? '👁️' : '🙈'}
          </button>
        </div>

        <button style={btnMainStyle}>SE CONNECTER</button>
        
        <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '25px' }}>
          Nouveau sur SUPCONTENT ? <span onClick={onSwitch} style={{ color: '#b208b4', cursor: 'pointer', fontWeight: 'bold' }}>Créer un compte</span>
        </p>
      </div>
    </div>
  );
};

const inputStyle = { width: '100%', padding: '16px', marginBottom: '20px', borderRadius: '12px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box', fontSize: '16px' };
const btnMainStyle = { width: '100%', padding: '18px', background: '#b208b4', border: 'none', color: 'white', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' };
const eyeStyle = { position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' };

export default Login;