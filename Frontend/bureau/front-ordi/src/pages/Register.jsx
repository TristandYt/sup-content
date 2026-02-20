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
    if (!pseudo || !email || !pass || !confirm) setError('Tous les champs sont obligatoires');
    else if (pass !== confirm) setError('Les mots de passe ne correspondent pas');
    else {
      setError('');
      alert("Compte créé avec succès !");
    }
  };

  const handleSocialRegister = (platform) => {
    console.log(`Inscription via ${platform}...`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ textAlign: 'center', color: '#b208b4', marginBottom: '25px' }}>Rejoindre la communauté</h2>
        
        {error && <p style={styles.error}>{error}</p>}

        <input name="pseudo" style={styles.input} placeholder="Pseudo" onChange={handleChange} />
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

        {/* --- SÉPARATEUR --- */}
        <div style={styles.dividerContainer}>
          <div style={styles.line}></div>
          <span style={styles.dividerText}>Ou s'inscrire avec</span>
          <div style={styles.line}></div>
        </div>

        {/* --- BOUTONS SOCIAUX --- */}
        <div style={styles.socialGroup}>
          <button onClick={() => handleSocialRegister('Google')} style={styles.socialBtn} title="Google">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="22" alt="Google" />
          </button>
          <button onClick={() => handleSocialRegister('GitHub')} style={styles.socialBtn} title="GitHub">
            <img src="https://www.svgrepo.com/show/512317/github-142.svg" width="22" alt="GitHub" style={{ filter: 'invert(1)' }} />
          </button>
          <button onClick={() => handleSocialRegister('Facebook')} style={styles.socialBtn} title="Facebook">
            <img src="https://www.svgrepo.com/show/448224/facebook.svg" width="26" alt="Facebook" />
          </button>
        </div>
        <p style={styles.footerText}>
          Déjà inscrit ? <span onClick={onSwitch} style={styles.link}>Se connecter</span>
        </p>
      </div>
    </div>
  );
};
export default Register;