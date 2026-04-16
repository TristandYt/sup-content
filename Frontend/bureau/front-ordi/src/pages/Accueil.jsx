import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "../../Style/Styles.css";
import defaultCover from "../assets/fr-default-large_default.jpg";

const Accueil = ({ onGameClick, searchTerm }) => {
  const { t } = useTranslation();
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
    return defaultCover;
  };

  const fetchGames = async () => {
    setLoading(true);
    try {
      const isSearching =
        (searchTerm && searchTerm.trim() !== "") ||
        params.genre ||
        params.platform;
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
      console.error("Erreur:", err);
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
    backgroundColor: "#1e1e38",
    color: "white",
    border: "1px solid #334155",
    borderRadius: "20px",
    padding: "5px 15px",
    outline: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    height: "35px",
  };

  return (
    <div style={{ width: "100%" }}>
      <header style={{ marginBottom: "30px" }}>
        <h2
          style={{
            fontSize: "2.2rem",
            color: "white",
            marginBottom: "10px",
            fontWeight: "bold",
          }}
        >
          Tendances mondiales
        </h2>
        <p style={{ color: "#94a3b8", marginBottom: "25px" }}>
          Tout le contenu SUPCONTENT à portée de clic.
        </p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={params.genre}
            onChange={(e) => setParams({ ...params, genre: e.target.value })}
            style={controlStyle}
          >
            <option value="">Genres</option>
            <option value="4">Combat</option>
            <option value="5">Shooter</option>
            <option value="12">RPG</option>
            <option value="31">Aventure</option>
          </select>

          <select
            value={params.platform}
            onChange={(e) => setParams({ ...params, platform: e.target.value })}
            style={controlStyle}
          >
            <option value="">Toutes Plateformes</option>
            <option value="6">PC (Windows)</option>
            <option value="48">PlayStation 4</option>
            <option value="167">PlayStation 5</option>
            <option value="49">Xbox One</option>
            <option value="169">Xbox Series X|S</option>
            <option value="130">Nintendo Switch</option>
          </select>

          <select
            value={params.sortBy}
            onChange={(e) => setParams({ ...params, sortBy: e.target.value })}
            style={controlStyle}
          >
            <option value="total_rating">Note</option>
            <option value="name">Nom</option>
            <option value="first_release_date">Date de sortie</option>
          </select>

          <button
            onClick={() =>
              setParams({
                ...params,
                sortOrder: params.sortOrder === "asc" ? "desc" : "asc",
              })
            }
            style={controlStyle}
          >
            {params.sortOrder === "asc" ? "↑ Croissant" : "↓ Décroissant"}
          </button>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "25px",
        }}
      >
        {loading ? (
          <p>Chargement...</p>
        ) : (
          games.map((game) => (
            <div
              key={game.id}
              onClick={() => onGameClick(game.id)}
              className="game-card"
              style={cardStyle}
            >
              <img
                src={getImageUrl(game)}
                alt={game.name}
                style={{ width: "100%", height: "350px", objectFit: "cover" }}
              />
              <div style={{ padding: "15px" }}>
                <h3
                  style={{
                    color: "white",
                    margin: "0 0 8px 0",
                    fontSize: "1rem",
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
                  <span
                    style={{
                      color: "#b208b4",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                    }}
                  >
                    ⭐ {(game.total_rating / 20).toFixed(1)} / 5
                  </span>
                  <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
                    {game.first_release_date
                      ? new Date(game.first_release_date * 1000).getFullYear()
                      : ""}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const cardStyle = {
  backgroundColor: "#1e1e38",
  borderRadius: "15px",
  overflow: "hidden",
  cursor: "pointer",
  border: "1px solid #334155",
};

export default Accueil;
