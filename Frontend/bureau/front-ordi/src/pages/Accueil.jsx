import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "../../Style/Styles.css";

// Importation de l'image de remplacement (plus propre pour React)
import defaultCover from "../assets/fr-default-large_default.jpg";

const Accueil = ({ onGameClick }) => {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState("");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const [params, setParams] = useState({
    sortBy: "total_rating",
    sortOrder: "desc",
    genre: "",
    platform: "",
  });

  const getImageUrl = (game) => {
    if (game.cover && game.cover.image_id) {
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`;
    }
    // On utilise l'importation définie plus haut
    return defaultCover;
  };

  const fetchGames = async () => {
    setLoading(true);
    try {
      const isSearching =
        searchTerm.trim() !== "" || params.genre || params.platform;
      const endpoint = isSearching ? "search" : "popular";

      const res = await axios.get(
        `http://localhost:3000/api/games/${endpoint}`,
        {
          params: {
            q: searchTerm,
            genre: params.genre,
            platform: params.platform,
            sortBy: params.sortBy,
            order: params.sortOrder,
          },
        },
      );
      setGames(res.data);
    } catch (err) {
      console.error("Erreur lors du chargement des jeux:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(
      () => {
        fetchGames();
      },
      searchTerm ? 500 : 0,
    );

    return () => clearTimeout(delay);
  }, [searchTerm, params]);

  const controlStyle = {
    backgroundColor: "#1a1a3a",
    color: "white",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "8px",
    padding: "8px 10px",
    outline: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    height: "40px",
  };

  return (
    <div style={{ width: "100%" }}>
      <header style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "2.5rem", margin: "0 0 5px 0", color: "white" }}>
          {t("homeTitle")}
        </h2>
        <p
          style={{ color: "#94a3b8", fontSize: "1.1rem", marginBottom: "25px" }}
        >
          {t("homeSubtitle")}
        </p>

        {/* BARRE DE RECHERCHE ET FILTRES */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            backgroundColor: "rgba(255,255,255,0.03)",
            padding: "10px",
            borderRadius: "12px",
          }}
        >
          {/* Recherche avec MARGE à DROITE pour l'espace */}
          <input
            type="text"
            placeholder={t("Recherche") || "Jeu..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: "1",
              minWidth: "80px",
              marginRight: "30px", // L'espace entre la barre et les tris est ici
              padding: "0 15px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              backgroundColor: "#1a1a3a",
              color: "white",
              outline: "none",
              fontSize: "0.9rem",
              height: "40px",
            }}
          />

          {/* GROUPE DES TRIS (collés entre eux par le gap de 8px) */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select
              value={params.genre}
              onChange={(e) => setParams({ ...params, genre: e.target.value })}
              style={{ ...controlStyle, width: "110px" }}
            >
              <option value="">Genres</option>
              <option value="4">Combat</option>
              <option value="5">Shooter</option>
              <option value="12">RPG</option>
              <option value="15">Stratégie</option>
              <option value="31">Aventure</option>
            </select>

            <select
              value={params.platform}
              onChange={(e) =>
                setParams({ ...params, platform: e.target.value })
              }
              style={{ ...controlStyle, width: "120px" }}
            >
              <option value="">Plateformes</option>
              <option value="6">PC</option>
              <option value="48">PS4</option>
              <option value="167">PS5</option>
              <option value="130">Switch</option>
            </select>

            <select
              value={params.sortBy}
              onChange={(e) => setParams({ ...params, sortBy: e.target.value })}
              style={{ ...controlStyle, width: "90px" }}
            >
              <option value="total_rating">Note</option>
              <option value="name">Nom</option>
              <option value="first_release_date">Date</option>
            </select>

            <button
              onClick={() =>
                setParams({
                  ...params,
                  sortOrder: params.sortOrder === "asc" ? "desc" : "asc",
                })
              }
              style={{ ...controlStyle, width: "120px", fontSize: "0.75rem" }}
            >
              {params.sortOrder === "asc" ? "↑ Croissant" : "↓ Décroissant"}
            </button>
          </div>
        </div>
      </header>

      {/* Grille de jeux */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "30px",
        }}
      >
        {loading ? (
          <p style={{ color: "white" }}>Chargement...</p>
        ) : games.length > 0 ? (
          games.map((game) => (
            <div
              key={game.id}
              className="game-card"
              onClick={() => onGameClick(game.id)}
              style={{
                backgroundColor: "#252545",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "0.3s",
                cursor: "pointer",
              }}
            >
              <img
                src={getImageUrl(game)}
                alt={game.name}
                style={{ width: "100%", height: "380px", objectFit: "cover" }}
              />
              <div style={{ padding: "20px" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    margin: "0 0 10px 0",
                    color: "white",
                  }}
                >
                  {game.name}
                </h3>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {game.total_rating ? (
                    <p
                      style={{
                        color: "#b208b4",
                        fontWeight: "bold",
                        margin: 0,
                      }}
                    >
                      ⭐ {(game.total_rating / 20).toFixed(1)} / 5
                    </p>
                  ) : (
                    <span style={{ color: "#64748b" }}>N/A</span>
                  )}
                  {game.first_release_date && (
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                      {new Date(game.first_release_date * 1000).getFullYear()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: "#94a3b8" }}>Aucun jeu trouvé.</p>
        )}
      </div>
    </div>
  );
};

export default Accueil;
