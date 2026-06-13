// pages/Parametres.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../Service/firebase";
import "../../Style/Styles.css";

const authAxios = async () => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  const token = await firebaseUser.getIdToken(true);
  return axios.create({
    baseURL: "http://localhost:3000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

const Parametres = ({ user }) => {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState(
    user?.preferences || {
      privateProfile: false,
      showAdultGames: false,
    },
  );
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    document.title = "Paramètres | TGMF";
  }, []);

  useEffect(() => {
    if (user && user.preferences) {
      setPreferences(user.preferences);
    }
  }, [user]);

  const togglePreference = async (key) => {
    setLoading(true);
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);

    try {
      const api = await authAxios();
      await api.put("/users/profile", { preferences: newPrefs });
    } catch (err) {
      alert("Erreur lors de la mise à jour des paramètres.");
      setPreferences(preferences);
    } finally {
      setLoading(false);
    }
  };
  // Exportation Minimaliste & RGPD Compliant
  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const api = await authAxios();
      const res = await api.get("/users/me/export");
      const rawData = res.data;

      const minimalistExport = {
        utilisateur: {
          pseudo:
            user?.pseudo ||
            rawData.user?.username ||
            rawData.user?.pseudo ||
            "Joueur",
          email: user?.email || rawData.user?.email || "Non renseigné",
        },
        collection: (rawData.library || rawData.collection || []).map(
          (game) => game.gameName || game.name || "Jeu sans nom",
        ),
        listes_personnalisees: (rawData.lists || rawData.customLists || []).map(
          (list) => ({
            nom_liste: list.name || "Liste sans nom",
            jeux: (list.games || []).map(
              (game) => game.gameName || game.name || "Jeu sans nom",
            ),
          }),
        ),
      };

      // Génération du fichier nettoyé
      const dataStr = JSON.stringify(minimalistExport, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `TGMF_Donnees_${user?.pseudo || "Utilisateur"}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur Export:", err);
      alert("Une erreur est survenue lors de l'exportation de vos données.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm(
      "⚠️ ATTENTION ⚠️\n\nÊtes-vous sûr de vouloir supprimer DÉFINITIVEMENT votre compte ? Cette action effacera toutes vos listes, favoris, et messages.",
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      "Êtes-vous vraiment sûr ? Cette action est IRRÉVERSIBLE.",
    );
    if (!confirm2) return;

    setLoading(true);
    try {
      const api = await authAxios();
      await api.delete("/users/account");

      if (auth.currentUser) {
        await auth.currentUser.delete();
      }

      navigate("/");
    } catch (err) {
      console.error("Erreur Suppression:", err);
      if (err.code === "auth/requires-recent-login") {
        alert(
          "Par mesure de sécurité, veuillez vous déconnecter puis vous reconnecter avant de supprimer votre compte.",
        );
      } else {
        alert(
          "Une erreur est survenue lors de la suppression de votre compte.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="accueil-container">
      <div
        className="hero-section"
        style={{
          minHeight: "160px",
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(59,130,246,0.1) 100%)",
        }}
      >
        <div className="hero-gradient" />
      </div>

      <div
        style={{
          maxWidth: "800px",
          margin: "-80px auto 0",
          padding: "0 20px 60px",
        }}
      >
        <div
          className="game-card-modern"
          style={{ padding: "30px", cursor: "default", position: "relative" }}
        >
          <h2
            className="hero-title"
            style={{
              fontSize: "1.8rem",
              margin: "0 0 24px 0",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <i className="fa-solid fa-gear" style={{ color: "#c084fc" }}></i>{" "}
            Paramètres du compte
          </h2>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "30px" }}
          >
            {/* ════ SECTION: AFFICHAGE ET CONFIDENTIALITÉ ════ */}
            <div>
              <h3
                className="section-title"
                style={{
                  fontSize: "1.2rem",
                  marginBottom: "15px",
                  borderBottom: "1px solid rgba(128,128,128,0.2)",
                  paddingBottom: "10px",
                }}
              >
                <i
                  className="fa-solid fa-eye"
                  style={{ marginRight: "8px", opacity: 0.7 }}
                ></i>{" "}
                Affichage et Confidentialité
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                <div
                  style={{
                    background: "rgba(128,128,128,0.05)",
                    padding: "20px",
                    borderRadius: "12px",
                    border: "1px solid rgba(128,128,128,0.1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "1.1rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <i
                          className="fa-solid fa-lock"
                          style={{ color: "rgba(239, 68, 68, 0.8)" }}
                        ></i>{" "}
                        Profil Privé
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.85rem",
                          opacity: 0.7,
                          maxWidth: "400px",
                          lineHeight: "1.5",
                        }}
                      >
                        Si activé, seuls vos abonnés mutuels pourront voir votre
                        bibliothèque de jeux et vos listes personnalisées.
                      </p>
                    </div>

                    <div
                      onClick={() =>
                        !loading && togglePreference("privateProfile")
                      }
                      style={{
                        width: "50px",
                        height: "28px",
                        borderRadius: "99px",
                        cursor: loading ? "wait" : "pointer",
                        background: preferences.privateProfile
                          ? "#9333ea"
                          : "rgba(128,128,128,0.3)",
                        position: "relative",
                        transition: "background 0.3s",
                        opacity: loading ? 0.5 : 1,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "3px",
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "#fff",
                          transition:
                            "left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                          left: preferences.privateProfile ? "25px" : "3px",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(128,128,128,0.05)",
                    padding: "20px",
                    borderRadius: "12px",
                    border: "1px solid rgba(128,128,128,0.1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "1.1rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <i
                          className="fa-solid fa-eye-slash"
                          style={{ color: "rgba(245, 158, 11, 0.8)" }}
                        ></i>{" "}
                        Afficher les jeux +18
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.85rem",
                          opacity: 0.7,
                          maxWidth: "400px",
                          lineHeight: "1.5",
                        }}
                      >
                        Autoriser l'affichage de contenu réservé à un public
                        averti dans les résultats de recherche et le catalogue.
                      </p>
                    </div>

                    <div
                      onClick={() =>
                        !loading && togglePreference("showAdultGames")
                      }
                      style={{
                        width: "50px",
                        height: "28px",
                        borderRadius: "99px",
                        cursor: loading ? "wait" : "pointer",
                        background: preferences.showAdultGames
                          ? "#9333ea"
                          : "rgba(128,128,128,0.3)",
                        position: "relative",
                        transition: "background 0.3s",
                        opacity: loading ? 0.5 : 1,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "3px",
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "#fff",
                          transition:
                            "left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                          left: preferences.showAdultGames ? "25px" : "3px",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ════ SECTION: DONNÉES ET SÉCURITÉ ════ */}
            <div style={{ marginTop: "10px" }}>
              <h3
                className="section-title"
                style={{
                  fontSize: "1.2rem",
                  marginBottom: "15px",
                  borderBottom: "1px solid rgba(128,128,128,0.2)",
                  paddingBottom: "10px",
                }}
              >
                <i
                  className="fa-solid fa-shield-halved"
                  style={{ marginRight: "8px", opacity: 0.7 }}
                ></i>{" "}
                Données et Sécurité
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                <div
                  style={{
                    background: "rgba(128,128,128,0.05)",
                    padding: "20px",
                    borderRadius: "12px",
                    border: "1px solid rgba(128,128,128,0.1)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "15px",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "1.1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <i
                        className="fa-solid fa-download"
                        style={{ color: "#3b82f6" }}
                      ></i>{" "}
                      Exporter mes données
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.85rem",
                        opacity: 0.7,
                        maxWidth: "400px",
                        lineHeight: "1.5",
                      }}
                    >
                      Téléchargez une copie conforme et lisible de votre profil
                      (pseudo, email, collection et listes) au format JSON,
                      excluant tout identifiant technique.
                    </p>
                  </div>
                  <button
                    className="category-btn active"
                    onClick={handleExportData}
                    disabled={exportLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(59, 130, 246, 0.15)",
                      borderColor: "rgba(59, 130, 246, 0.4)",
                      color: "#3b82f6",
                    }}
                  >
                    {exportLoading ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin"></i>{" "}
                        Traitement...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-file-export"></i> Exporter
                      </>
                    )}
                  </button>
                </div>

                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.05)",
                    padding: "20px",
                    borderRadius: "12px",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "15px",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "1.1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#ef4444",
                      }}
                    >
                      <i className="fa-solid fa-triangle-exclamation"></i> Zone
                      de danger
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.85rem",
                        color: "#ef4444",
                        opacity: 0.8,
                        maxWidth: "400px",
                        lineHeight: "1.5",
                      }}
                    >
                      Supprimer définitivement votre compte. Cette action est
                      irréversible et écrasera l'ensemble de vos données.
                    </p>
                  </div>
                  <button
                    className="category-btn"
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "#ef4444",
                      borderColor: "#ef4444",
                      color: "#fff",
                    }}
                  >
                    <i className="fa-solid fa-trash-can"></i> Supprimer le
                    compte
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parametres;
