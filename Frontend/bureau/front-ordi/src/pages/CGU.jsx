import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../Style/Styles.css";
import Footer from "../components/Footer";

const CGU = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "CGU | TGMF";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="accueil-container">
      <div className="hero-section" style={{ minHeight: "160px" }}>
        <div className="hero-gradient" />
        <div className="hero-content">
          <h2 className="hero-title">Conditions Générales d'Utilisation</h2>
        </div>
      </div>

      <div style={{ padding: "20px 40px" }}>
        <button className="category-btn" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i> Retour
        </button>
      </div>

      <div style={{ padding: "0 40px 40px 40px", maxWidth: "900px", margin: "0 auto", lineHeight: "1.8" }}>
        <h3>1. Objet</h3>
        <p>
          Les présentes CGU régissent l'accès et l'utilisation de l'application TGMF, une plateforme sociale permettant la gestion de bibliothèque vidéoludique.
        </p>

        <h3>2. Règles de Communauté et Modération</h3>
        <p>
          Les utilisateurs s'engagent à faire preuve de respect dans leurs critiques, messages et interventions sur le forum.
          Toute insulte, harcèlement ou propos discriminatoire pourra faire l'objet d'un signalement via notre outil de modération, entraînant la suppression des messages ou le bannissement du compte par un Administrateur.
        </p>

        <h3>3. Messagerie Privée et Protection</h3>
        <p>
          Afin de prévenir le spam et le harcèlement, l'envoi de messages privés à un autre utilisateur nécessite obligatoirement un <strong>Suivi Mutuel</strong> (Mutual Follow). Vous ne pouvez discuter qu'avec les membres auxquels vous êtes abonné(e) et qui sont abonnés à vous en retour.
        </p>

        <h3>4. Protection des Mineurs (Bouclier PEGI)</h3>
        <p>
          En créant un compte, vous vous engagez à renseigner votre date de naissance exacte. TGMF applique un filtrage strict qui empêche les mineurs d'accéder aux fiches des jeux classés +18 ou contenant des thèmes pour adultes reconnus par notre fournisseur de données (IGDB).
        </p>

        <h3>5. Limitation de responsabilité</h3>
        <p>
          TGMF dépend d'API tierces (IGDB, Firebase). L'éditeur ne saurait être tenu responsable d'une interruption de service, d'une erreur de classification d'un jeu ou d'une perte temporaire de données de profil.
        </p>
      </div>

      <Footer />
    </div>
  );
};

export default CGU;