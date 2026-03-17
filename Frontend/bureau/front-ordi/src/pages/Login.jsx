import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../../../Style/Styles.css';

const Login = ({ onSwitch, onLoginSuccess }) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('kiki@kiki.com'); 
  const [password, setPassword] = useState('kikiki');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError(t('error_missing_info'));
    } else {
      setError('');
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

  const EyeIcon = ({ open }) => (
    open ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
    )
  );

  return (
    <div className="container">
      {/* On s'assure que la card est en position relative pour que les drapeaux se calent dessus */}
      <div className="card" style={{ position: 'relative' }}>
        
        {/* SÉLECTEUR DE LANGUE : Positionné en haut à droite de la card */}
        <div style={{ 
          position: 'absolute', 
          top: '20px', 
          right: '20px', 
          display: 'flex', 
          gap: '8px',
          zIndex: 10 
        }}>
          <button 
            onClick={() => changeLanguage('Français')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <img 
              src="https://flagcdn.com/w40/fr.png" 
              width="22" 
              alt="FR" 
              style={{ 
                opacity: i18n.language === 'Français' ? 1 : 0.3, 
                borderRadius: '2px',
                transition: 'opacity 0.2s'
              }} 
            />
          </button>
          <button 
            onClick={() => changeLanguage('English')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <img 
              src="https://flagcdn.com/w40/gb.png" 
              width="22" 
              alt="EN" 
              style={{ 
                opacity: i18n.language === 'English' ? 1 : 0.3, 
                borderRadius: '2px',
                transition: 'opacity 0.2s'
              }} 
            />
          </button>
        </div>

        {/* TITRE : Reste parfaitement centré */}
        <h2 className="title" style={{ textAlign: 'center', marginBottom: '25px' }}>
          {t('title')}
        </h2>
        
        <div className="error-msg">
            {error && error}
        </div>

        <div className="form-group">
          <label className="label-text">{t('label_email')}</label>
          <input 
            className="input-field" 
            placeholder="Ex: kiki@mail.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="label-text">{t('label_password')}</label>
          <div className="password-container">
            <input 
              className="input-field" 
              type={showPass ? "text" : "password"} 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="eye-button" style={{ opacity: 0.7 }}>
              <EyeIcon open={showPass} />
            </button>
          </div>
        </div>

        <button onClick={handleLogin} className="btn-main">{t('button_submit')}</button>

        <div className="divider">
          <div className="divider-line"></div>
          <span className="divider-text">{t('divider_text')}</span>
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
          {t('footer_text')} <span onClick={onSwitch} className="link-highlight" style={{ cursor: 'pointer' }}>{t('footer_link')}</span>
        </p>
      </div>
    </div>
  );
};

export default Login;