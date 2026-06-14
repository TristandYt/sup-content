import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../Style/Styles.css";
import Footer from "../components/Footer";

const Confidentialite = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Politique de Confidentialité | TGMF";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="accueil-container">
      <div className="hero-section" style={{ minHeight: "160px" }}>
        <div className="hero-gradient" />
        <div className="hero-content">
          <h2 className="hero-title">Politique de Confidentialité</h2>
        </div>
      </div>

      <div style={{ padding: "20px 40px" }}>
        <button className="category-btn" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i> Retour
        </button>
      </div>

      <div style={{ padding: "0 40px 40px 40px", maxWidth: "900px", margin: "0 auto", lineHeight: "1.8" }}>
        <h3>1. Données collectées</h3>
        <p>
          Lors de votre inscription et de votre utilisation de TGMF, nous collectons : votre adresse email, votre pseudonyme, votre date de naissance (pour l'application de notre algorithme de protection PEGI), ainsi que vos listes de jeux et critiques.
        </p>

        <h3>2. Utilisation de vos données</h3>
        <p>
          Vos données sont strictement utilisées pour :
          <ul>
            <li>Personnaliser votre expérience et générer des recommandations de jeux.</li>
            <li>Bloquer l'accès aux jeux +18 si vous êtes mineur (Bouclier PEGI).</li>
            <li>Alimenter le fil d'actualité de la communauté.</li>
          </ul>
        </p>

        <h3>3. Droits des utilisateurs (RGPD)</h3>
        <p>
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. 
          <br/>
          <strong>Exportation :</strong> Vous pouvez télécharger l'intégralité de vos données personnelles (profil, bibliothèque, favoris) au format JSON depuis vos Paramètres de compte.
          <br/>
          <strong>Suppression :</strong> Vous avez la possibilité de supprimer définitivement votre compte, ce qui effacera toutes vos listes, critiques et messages associés.
        </p>
      </div>

      <Footer />
    </div>
  );
};

export default Confidentialite;