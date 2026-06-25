import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../Style/Styles.css";

// Pied de page principal : contient la navigation secondaire et les réseaux sociaux
const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="modern-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3 className="logo-text">TGMF</h3>
          <p className="footer-description">{t("footer_description")}</p>
          <div className="footer-powered">
            <span>{t("footer_powered_by")}</span>
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
          <h4>{t("footer_nav_title")}</h4>
          <Link to="/">{t("footer_nav_home")}</Link>
          <Link to="/catalogue">{t("footer_nav_catalogue")}</Link>
          <Link to="/forum">{t("footer_nav_forum")}</Link>
          <Link to="/a-propos">{t("footer_nav_about")}</Link>
        </div>

        <div className="footer-links-group">
          <h4>{t("footer_legal_title")}</h4>
          <Link to="/mentions-legales">{t("footer_legal_terms")}</Link>
          <Link to="/cgu">{t("footer_legal_cgu")}</Link>
          <Link to="/confidentialite">{t("footer_legal_privacy")}</Link>
        </div>

        <div className="footer-links-group">
          <h4>{t("footer_socials_title")}</h4>
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
        <p>{t("footer_copyright", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
};

export default Footer;
