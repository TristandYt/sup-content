import React, { useState } from 'react';

const Register = ({ onSwitch }) => {
  const [formData, setFormData] = useState({ pseudo: '', email: '', pass: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); // Ajouté pour le champ de confirmation
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = () => {
    const { pseudo, email, pass, confirm } = formData;
    if (!pseudo || !email || !pass || !confirm) setError('Tous les champs sont obligatoires');
    else if (pass !== confirm) setError('Les mots de passe ne correspondent pas');
    else {
      setError('');
      alert("Compte créé avec succès !");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ textAlign: 'center', color: '#b208b4', marginBottom: '25px' }}>Rejoindre la communauté</h2>
        
        {error && <p style={styles.error}>{error}</p>}

        <input name="pseudo" style={styles.input} placeholder="Nom d'utilisateur" onChange={handleChange} />
        <input name="email" style={styles.input} placeholder="Adresse Email" onChange={handleChange} />
        
        <div style={styles.rel}>
          <input name="pass" type={showPass ? "text" : "password"} style={{ ...styles.input, paddingRight: '50px' }} placeholder="Mot de passe" onChange={handleChange} />
          <button onClick={() => setShowPass(!showPass)} style={styles.eye}>{showPass ? '👁️' : '🙈'}</button>
        </div>

        <div style={styles.rel}>
          <input name="confirm" type={showConfirm ? "text" : "password"} style={{ ...styles.input, paddingRight: '50px' }} placeholder="Confirmer le mot de passe" onChange={handleChange} />
          <button onClick={() => setShowConfirm(!showConfirm)} style={styles.eye}>{showConfirm ? '👁️' : '🙈'}</button>
        </div>

        <button onClick={handleRegister} style={styles.btn}>CRÉER MON COMPTE</button>

        <p style={styles.footerText}>
          Déjà inscrit ? <span onClick={onSwitch} style={styles.link}>Se connecter</span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }, // Changé à 100vh pour un centrage complet comme dans Login
  card: { backgroundColor: '#252545', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  input: { width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #334155', background: '#1a1a2e', color: 'white', boxSizing: 'border-box', outline: 'none' },
  rel: { position: 'relative' },
  eye: { position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }, // Centré verticalement
  btn: { width: '100%', padding: '16px', backgroundColor: '#b208b4', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' },
  error: { color: '#ff4444', textAlign: 'center', marginBottom: '15px', fontSize: '14px' },
  footerText: { textAlign: 'center', color: '#94a3b8', marginTop: '20px' },
  link: { color: '#b208b4', cursor: 'pointer', fontWeight: 'bold' }
};

export default Register;