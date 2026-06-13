import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../Style/Styles.css";
import Footer from "../components/Footer";

const MentionsLegales = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Mentions Légales | TGMF";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="accueil-container">
      <div className="hero-section" style={{ minHeight: "160px" }}>
        <div className="hero-gradient" />
        <div className="hero-content">
          <h2 className="hero-title">Mentions Légales</h2>
        </div>
      </div>

      <div style={{ padding: "20px 40px" }}>
        <button className="category-btn" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i> Retour
        </button>
      </div>

      <div style={{ padding: "0 40px 40px 40px", maxWidth: "900px", margin: "0 auto", lineHeight: "1.8" }}>
        <h3>1. Éditeur de la plateforme</h3>
        <p>
          La plateforme <strong>TGMF</strong> est un projet étudiant développé et édité par Tristan dans le cadre du cursus SUPINFO.
        </p>

        <h3>2. Hébergement</h3>
        <p>
          L'application est actuellement hébergée en environnement local / conteneurs Docker pour le développement. Les données de la base (Firestore Emulator) sont traitées en local.
        </p>

        <h3>3. Propriété intellectuelle</h3>
        <p>
          Le code source de l'application est la propriété de ses développeurs. Les images de jaquettes, données de jeux et métadonnées appartiennent à <strong>IGDB.com</strong> (Twitch) et à leurs ayants droit respectifs. TGMF utilise l'API publique d'IGDB uniquement à des fins d'information et de constitution de bibliothèque personnelle.
        </p>
      </div>

      <Footer />
    </div>
  );
};

export default MentionsLegales;