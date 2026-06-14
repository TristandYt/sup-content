import React, { useEffect } from "react";
import Footer from "../components/Footer";
import logo from "../assets/Logo_PLUSFONCE.png";
import "../../Style/Styles.css";

const APropos = () => {
  // Mise à jour du titre de l'onglet et retour en haut de page à l'affichage
  useEffect(() => {
    document.title = "À propos | TGMF";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="accueil-container">
      <main className="main-content-wrapper">
        <div
          className="game-card-modern"
          style={{
            padding: "60px 40px",
            textAlign: "center",
            cursor: "default",
          }}
        >
          <h1 className="hero-title" style={{ marginBottom: "40px" }}>
            À propos de TGMF
          </h1>

          <div style={{ marginBottom: "50px" }}>
            <img
              src={logo}
              alt="TGMF Logo"
              style={{
                width: "250px",
                height: "250px",
                objectFit: "contain",
                transform: "rotate(270deg)",
                filter: "drop-shadow(0 0 20px rgba(147, 51, 234, 0.4))",
              }}
            />
          </div>

          <section style={{ marginBottom: "40px" }}>
            <h2
              className="section-title"
              style={{
                justifyContent: "center",
                marginBottom: "20px",
                border: "none",
              }}
            >
              L'Équipe du Projet
            </h2>
            <p
              className="hero-subtitle"
              style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                color: "#c084fc",
                marginBottom: "25px",
              }}
            >
              Projet 3PROJ - SUPINFO Tours
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <p
                className="hero-subtitle"
                style={{ color: "white", fontSize: "1.1rem" }}
              >
                Killian PAUTROT
              </p>
              <p
                className="hero-subtitle"
                style={{ color: "white", fontSize: "1.1rem" }}
              >
                Tristan DESCHAMPS
              </p>
              <p
                className="hero-subtitle"
                style={{ color: "white", fontSize: "1.1rem" }}
              >
                Guillaume LEROUX
              </p>
              <p
                className="hero-subtitle"
                style={{ color: "white", fontSize: "1.1rem" }}
              >
                Matéo THORIS
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default APropos;
