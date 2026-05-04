import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "../../Style/Styles.css";
import defaultCover from "../assets/fr-default-large_default.jpg";

const Accueil = ({ onGameClick, searchTerm }) => {
  const { t } = useTranslation();
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchType, setSearchType] = useState("games"); // "games" ou "users"
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [params, setParams] = useState({
    sortBy: "total_rating",
    sortOrder: "desc",
    genre: "",
    platform: "",
  });

  const categories = [
    { label: "Tous", value: "" },
    { label: "Combat", value: "4" },
    { label: "Shooter", value: "5" },
    { label: "RPG", value: "12" },
    { label: "Aventure", value: "31" },
  ];

  const getImageUrl = (game) => {
    if (game.cover && game.cover.image_id) {
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`;
    }
    return defaultCover;
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const hasSearchTerm = searchTerm && searchTerm.trim() !== "";

      if (searchType === "users") {
        setGames([]); // On vide les jeux pour ne pas polluer l'affichage
        if (!hasSearchTerm) {
          setUsers([]);
          setLoading(false);
          return;
        }
        const res = await axios.get(`http://localhost:3000/api/users/search`, {
          params: { q: searchTerm.trim() },
        });
        setUsers(res.data);
      } else {
        setUsers([]); // On vide les utilisateurs
        const endpoint = hasSearchTerm ? "search" : "popular";
        const res = await axios.get(
          `http://localhost:3000/api/games/${endpoint}`,
          {
            params: {
              ...(hasSearchTerm && { q: searchTerm.trim() }),
              genre: params.genre,
              platform: params.platform,
              sortBy: params.sortBy,
              order: params.sortOrder,
            },
          },
        );
        setGames(res.data);
      }
    } catch (err) {
      console.error("Erreur fetchResults:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(
      () => {
        fetchResults();
      },
      searchTerm ? 500 : 0,
    );
    return () => clearTimeout(delay);
  }, [searchTerm, params, searchType]);

  const handleCategoryChange = (value) => {
    setActiveCategory(
      categories.find((c) => c.value === value)?.label || "Tous",
    );
    setParams((prev) => ({ ...prev, genre: value }));
  };

  return (
    <div className="accueil-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-gradient"></div>
        <div className="hero-content">
          <h2 className="hero-title">Découvrez les meilleurs jeux</h2>
          <p className="hero-subtitle">
            Tout le contenu SUPCONTENT à portée de clic. Explorez, filtrez et
            trouvez votre prochain jeu préféré.
          </p>
        </div>
      </div>

      {/* Type de recherche Selector */}
      <div className="categories-nav" style={{ marginBottom: "1rem" }}>
        <button
          className={`category-btn ${searchType === "games" ? "active" : ""}`}
          onClick={() => setSearchType("games")}
        >
          🎮 Jeux
        </button>
        <button
          className={`category-btn ${searchType === "users" ? "active" : ""}`}
          onClick={() => setSearchType("users")}
        >
          👥 Membres
        </button>
      </div>

      {/* Categories Navigation (uniquement pour les jeux) */}
      {searchType === "games" && (
        <div className="categories-nav">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => handleCategoryChange(category.value)}
              className={`category-btn ${
                activeCategory === category.label ? "active" : ""
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      )}

      {/* Filters Section (uniquement pour les jeux) */}
      {searchType === "games" && (
        <div className="filters-section">
          <div className="filters-container">
            <select
              value={params.platform}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, platform: e.target.value }))
              }
              className="filter-select"
            >
              <option value="">🎮 Toutes Plateformes</option>
              <option value="6">💻 PC (Windows)</option>
              <option value="48">🎮 PlayStation 4</option>
              <option value="167">🎮 PlayStation 5</option>
              <option value="49">🎮 Xbox One</option>
              <option value="169">🎮 Xbox Series X|S</option>
              <option value="130">🎮 Nintendo Switch</option>
            </select>

            <select
              value={params.sortBy}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, sortBy: e.target.value }))
              }
              className="filter-select"
            >
              <option value="total_rating">⭐ Note</option>
              <option value="name">📝 Nom</option>
              <option value="first_release_date">📅 Date de sortie</option>
            </select>

            <button
              onClick={() =>
                setParams((prev) => ({
                  ...prev,
                  sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
                }))
              }
              className="filter-select sort-btn"
            >
              {params.sortOrder === "asc" ? "↑ Croissant" : "↓ Décroissant"}
            </button>
          </div>
        </div>
      )}

      {/* Section Title */}
      <div className="section-header">
        <div className="section-icon">
          {searchType === "games" ? "🔥" : "✨"}
        </div>
        <h3 className="section-title">
          {searchTerm
            ? `Résultats pour "${searchTerm}"`
            : searchType === "games"
              ? "Tendances mondiales"
              : "Rechercher un membre"}
        </h3>
        <div className="section-count">
          {searchType === "games"
            ? `${games.length} jeux`
            : `${users.length} membres`}
        </div>
      </div>

      {/* Games Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Recherche en cours...</p>
        </div>
      ) : (searchType === "games" ? games.length : users.length) === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            {searchType === "games" ? "🎮" : "👤"}
          </div>
          <h3 className="empty-title">Aucun résultat</h3>
          <p className="empty-text">
            Essayez de modifier vos filtres ou votre recherche
          </p>
        </div>
      ) : (
        <div className={searchType === "games" ? "games-grid" : "game-grid"}>
          {searchType === "games"
            ? games.map((game) => (
                <div
                  key={game.id}
                  onClick={() => onGameClick(game.id)}
                  className="game-card-modern"
                >
                  <div className="game-image-container">
                    <img
                      src={getImageUrl(game)}
                      alt={game.name}
                      className="game-image"
                    />
                    <div className="game-overlay"></div>

                    {/* Rating Badge */}
                    {game.total_rating && (
                      <div className="rating-badge">
                        <span className="rating-star">⭐</span>
                        <span className="rating-value">
                          {(game.total_rating / 20).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="game-content">
                    <h3 className="game-title">{game.name}</h3>

                    <div className="game-meta">
                      <span className="game-year">
                        {game.first_release_date
                          ? new Date(
                              game.first_release_date * 1000,
                            ).getFullYear()
                          : "TBA"}
                      </span>
                      {game.genres && game.genres.length > 0 && (
                        <span className="game-genre">
                          {game.genres[0].name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            : users.map((u) => (
                <div
                  key={u.uid}
                  className="game-card-modern"
                  style={{ cursor: "pointer" }}
                >
                  <div
                    className="game-image-container"
                    style={{
                      borderRadius: "50%",
                      width: "120px",
                      height: "120px",
                      margin: "20px auto 10px",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={
                        u.avatar ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${u.pseudo}`
                      }
                      alt={u.pseudo}
                      className="game-image"
                    />
                  </div>
                  <div
                    className="game-content"
                    style={{ textAlign: "center", paddingBottom: "20px" }}
                  >
                    <h3 className="game-title">{u.pseudo}</h3>
                    <p className="game-genre" style={{ fontSize: "0.8rem" }}>
                      {u.bio || "Joueur passionné"}
                    </p>
                  </div>
                </div>
              ))}
        </div>
      )}
    </div>
  );
};

export default Accueil;
