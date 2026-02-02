import React, { useState } from 'react';

const Register = ({ onSwitch }) => {
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false); // État pour l'œil 1
  const [showConfirm, setShowConfirm] = useState(false); // État pour l'œil 2
  const [error, setError] = useState('');

  const handleRegister = () => {
    if (!pseudo || !email || !pass || !confirm) {
      setError('Champ incomplet');
    } else if (pass !== confirm) {
      setError('Mots de passe différents');
    } else {
      setError('');
      alert("Inscription réussie !");
    }
  };

  const handleSwitch = () => {
    setPseudo(''); setEmail(''); setPass(''); setConfirm(''); setError('');
    onSwitch();
  };

  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{ height: '24px', marginBottom: '10px' }}>
        {error && <p style={{ color: '#ff4444', fontSize: '13px', margin: 0, textAlign: 'center' }}>{error}</p>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          style={styles.input} 
          placeholder="Pseudo" 
          value={pseudo} 
          onChange={(e) => setPseudo(e.target.value)} 
        />
        <input 
          style={styles.input} 
          type="email" 
          placeholder="Adresse Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />

        {/* Champ Mot de passe 1 */}
        <div style={{ position: 'relative' }}>
          <input 
            style={{ ...styles.input, marginBottom: 0 }} 
            type={showPass ? "text" : "password"} 
            placeholder="Mot de passe" 
            value={pass} 
            onChange={(e) => setPass(e.target.value)} 
          />
          <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeBtn}>
            {showPass ? '👁️' : '🙈'}
          </button>
        </div>

        {/* Champ Mot de passe 2 (Confirmation) */}
        <div style={{ position: 'relative' }}>
          <input 
            style={{ ...styles.input, marginBottom: 0 }} 
            type={showConfirm ? "text" : "password"} 
            placeholder="Confirmer mot de passe" 
            value={confirm} 
            onChange={(e) => setConfirm(e.target.value)} 
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
            {showConfirm ? '👁️' : '🙈'}
          </button>
        </div>

        <button onClick={handleRegister} style={styles.btnPrimary}>
          S'INSCRIRE
        </button>
      </div>

      <button onClick={handleSwitch} style={styles.btnLink}>
        Déjà un compte ? Se connecter
      </button>
    </div>
  );
};

const styles = {
  input: {
    width: '100%', padding: '12px 15px', borderRadius: '8px', background: '#0f172a',
    color: 'white', border: '1px solid #334155', fontSize: '15px', boxSizing: 'border-box'
  },
  eyeBtn: {
    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px'
  },
  btnPrimary: {
    width: '100%', backgroundColor: '#b208b4', color: 'white', padding: '14px',
    borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '15px', marginTop: '5px'
  },
  btnLink: {
    width: '100%', background: 'none', border: 'none', color: '#94a3b8',
    marginTop: '20px', fontSize: '14px', textDecoration: 'underline'
  }
};

export default Register;