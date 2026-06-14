import React from "react";
import { Link } from "react-router-dom";
import "../../Style/Styles.css";

// Pied de page principal : contient la navigation secondaire et les réseaux sociaux
const Footer = () => {
  return (
    <footer className="modern-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3 className="logo-text">TGMF</h3>
          <p className="footer-description">
            Votre plateforme sociale de jeux vidéo. Gérez votre collection,
            découvrez de nouveaux titres et échangez avec la communauté.
          </p>
          <div className="footer-powered">
            <span>Powered by</span>
            <a
              href="https://www.igdb.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i
                className="fa-solid fa-database"
                style={{ marginRight: "6px" }}
              ></i>
              <span className="igdb-text">IGDB API</span>
            </a>
          </div>
        </div>

        <div className="footer-links-group">
          <h4>Navigation</h4>
          <Link to="/">Accueil</Link>
          <Link to="/catalogue">Catalogue</Link>
          <Link to="/forum">Forum</Link>
          <Link to="/a-propos">À propos</Link>
        </div>

        <div className="footer-links-group">
          <h4>Légal</h4>
          <Link to="/mentions-legales">Mentions légales</Link>
          <Link to="/cgu">Conditions d'utilisation</Link>
          <Link to="/confidentialite">Politique de confidentialité</Link>
        </div>

        <div className="footer-links-group">
          <h4>Réseaux</h4>
          <div className="footer-socials">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa-brands fa-github"></i>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa-brands fa-twitter"></i>
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa-brands fa-discord"></i>
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} TGMF. Tous droits réservés.</p>
      </div>
    </footer>
  );
};

export default Footer;
