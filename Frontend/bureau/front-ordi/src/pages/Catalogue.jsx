import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../Service/firebase";
import "../../Style/Styles.css";
import defaultCover from "../assets/fr-default-large_default.jpg";
import Footer from "../components/Footer";

const authAxios = async () => {
  const token = await auth.currentUser?.getIdToken(true);
  return axios.create({
    baseURL: "http://localhost:3000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

const PAGE_SIZE = 24;

const PaginationBar = ({
  page,
  estimatedTotal,
  hasMore,
  loading,
  onPageChange,
}) => {
  const btnBase = {
    padding: "8px 14px",
    minWidth: "40px",
    border: "1px solid rgba(128,128,128,0.2)",
    borderRadius: "8px",
    background: "transparent",
    color: "currentColor",
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: "all 0.15s",
  };
  const btnActive = {
    ...btnBase,
    background: "#9333ea",
    borderColor: "#9333ea",
    color: "#fff",
  };
  const btnDisabled = { ...btnBase, opacity: 0.3, cursor: "default" };

  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      <button
        style={page === 1 || loading ? btnDisabled : btnBase}
        disabled={page === 1 || loading}
        onClick={() => onPageChange(page - 1)}
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      <button style={btnActive}>{page}</button>
      <button
        style={!hasMore || loading ? btnDisabled : btnBase}
        disabled={!hasMore || loading}
        onClick={() => onPageChange(page + 1)}
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  );
};

const Catalogue = ({ onGameClick, user, searchTerm }) => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [params, setParams] = useState({
    sortBy: "total_rating",
    sortOrder: "desc",
    genre: "",
    platform: "",
    style: "",
  });

  const CATEGORIES = [
    { label: "Tous", value: "", icon: "fa-solid fa-layer-group" },
    { label: "Combat", value: "4", icon: "fa-solid fa-hand-fist" },
    { label: "Shooter", value: "5", icon: "fa-solid fa-crosshairs" },
    { label: "RPG", value: "12", icon: "fa-solid fa-dragon" },
    { label: "Aventure", value: "31", icon: "fa-solid fa-compass" },
  ];
  const [activeCategory, setActiveCategory] = useState("Tous");

  useEffect(() => {
    document.title = "Catalogue | TGMF";
  }, []);

  const getImageUrl = (game) => {
    if (game.cover?.image_id)
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`;
    return defaultCover;
  };

  const fetchGames = useCallback(async (targetPage = 1) => {
    setError(null);
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const api = auth.currentUser
        ? await authAxios()
        : axios.create({ baseURL: "http://localhost:3000/api" });
      const hasSearchTerm = searchTerm && searchTerm.trim() !== "";
      const hasCustomSort = params.sortBy !== "total_rating" || params.sortOrder !== "desc";
      const endpoint = hasSearchTerm
        ? "search"
        : params.genre || params.platform || params.style || hasCustomSort
          ? "filtered"
          : "popular";

      const queryParams = {
        page: targetPage,
        limit: PAGE_SIZE,
        sortBy: params.sortBy || "total_rating",
        order: params.sortOrder || "desc",
        sort: params.sortBy || "total_rating",
        sortOrder: params.sortOrder || "desc",
      };

      if (hasSearchTerm) queryParams.q = searchTerm.trim();
      if (params.genre) queryParams.genre = params.genre;
      if (params.platform) queryParams.platform = params.platform;
      if (params.style) queryParams.style = params.style;

      const res = await api.get(`/games/${endpoint}`, { params: queryParams });
      const data = res.data.games || res.data.results || res.data;
      let gamesList = Array.isArray(data) ? data : [];
      
      setGames(gamesList);
      
      // On assouplit la condition hasMore pour gérer les limites imposées par le backend (connecté ou non)
      setHasMore(gamesList.length >= 10);
      setPage(targetPage);
    } catch (err) {
      setError("Impossible de charger les jeux.");
    } finally {
      setLoading(false);
    }
  }, [params, searchTerm]);

  useEffect(() => {
    fetchGames(1);
  }, [fetchGames]);

  // Fonction pour afficher des labels clairs plutôt que "Croissant/Décroissant"
  const getOrderLabel = () => {
    if (params.sortBy === "name") return params.sortOrder === "asc" ? "De A à Z" : "De Z à A";
    if (params.sortBy === "first_release_date") return params.sortOrder === "asc" ? "Plus anciens" : "Plus récents";
    return params.sortOrder === "asc" ? "Moins bien notés" : "Mieux notés";
  };

  // Fonction pour appliquer un tri intelligent par défaut selon le critère choisi
  const handleSortByChange = (e) => {
    const newSortBy = e.target.value;
    const newOrder = newSortBy === "name" ? "asc" : "desc"; // Par défaut: A-Z pour les noms, Décroissant pour le reste
    setParams((p) => ({ ...p, sortBy: newSortBy, sortOrder: newOrder }));
  };

  return (
    <div className="accueil-container">
      <div className="hero-section" style={{ minHeight: "160px" }}>
        <div className="hero-gradient" />
        <div className="hero-content">
          <h2 className="hero-title">
            {searchTerm ? `Résultats pour "${searchTerm}"` : "Catalogue"}
          </h2>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        <button className="category-btn" onClick={() => navigate("/")}>
          <i className="fa-solid fa-arrow-left"></i> Retour
        </button>
      </div>

      <div className="categories-nav">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => {
              setActiveCategory(c.label);
              setParams((p) => ({ ...p, genre: c.value }));
            }}
            className={`category-btn ${activeCategory === c.label ? "active" : ""}`}
          >
            <i className={c.icon} style={{ marginRight: "6px" }}></i> {c.label}
          </button>
        ))}
      </div>

      <div className="filters-section">
        <div className="filters-container">
          <select
            value={params.platform}
            onChange={(e) =>
              setParams((p) => ({ ...p, platform: e.target.value }))
            }
            className="filter-select"
          >
            <option value="">🎮 Toutes les Plateformes</option>
            <option value="6">💻 PC (Windows)</option>
            <option value="48">🎮 PlayStation 4</option>
            <option value="167">🎮 PlayStation 5</option>
            <option value="49">🎮 Xbox One</option>
            <option value="169">🎮 Xbox Series X|S</option>
            <option value="130">🎮 Nintendo Switch</option>
          </select>
          <select
            value={params.style}
            onChange={(e) =>
              setParams((p) => ({ ...p, style: e.target.value }))
            }
            className="filter-select"
          >
            <option value="">🎭 Tous les Styles</option>
            <option value="1">💥 Action</option>
            <option value="18">🚀 Science-Fiction</option>
            <option value="19">👻 Horreur</option>
            <option value="21">🏕️ Survie</option>
            <option value="22">🌍 Open World</option>
          </select>
          <select
            value={params.sortBy}
            onChange={handleSortByChange}
            className="filter-select"
          >
            <option value="total_rating">⭐ Note</option>
            <option value="name">📝 Nom</option>
            <option value="first_release_date">📅 Date de sortie</option>
          </select>
          <button
            onClick={() =>
              setParams((p) => ({
                ...p,
                sortOrder: p.sortOrder === "asc" ? "desc" : "asc",
              }))
            }
            className="filter-select"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <i
              className={
                params.sortOrder === "asc"
                  ? "fa-solid fa-arrow-up-wide-short"
                  : "fa-solid fa-arrow-down-wide-short"
              }
            ></i>
            {getOrderLabel()}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      ) : games.length === 0 ? (
        <div className="empty-state" style={{ margin: "40px auto", textAlign: "center" }}>
          <div className="empty-icon" style={{ fontSize: "3rem", opacity: 0.5, marginBottom: "1rem" }}>
            <i className="fa-solid fa-ghost"></i>
          </div>
          <h3 className="empty-title">Aucun jeu trouvé</h3>
          <p className="empty-text">Il n'y a plus de résultats ou la recherche est vide.</p>
        </div>
      ) : (
        <div className="games-grid">
          {games.map((game) => (
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
                {game.total_rating && (
                  <div className="rating-badge">
                    <i className="fa-solid fa-star"></i>{" "}
                    {(game.total_rating / 20).toFixed(1)}
                  </div>
                )}
              </div>
              <div className="game-content">
                <h3 className="game-title">{game.name}</h3>
                <div className="game-meta">
                  <span className="game-year">
                    {game.first_release_date
                      ? new Date(game.first_release_date * 1000).getFullYear()
                      : "TBA"}
                  </span>
                  {game.genres && game.genres.length > 0 && (
                  <span className="game-genre">{game.genres[0].name}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: "40px" }}>
        <PaginationBar
          page={page}
          hasMore={hasMore}
          loading={loading}
          onPageChange={fetchGames}
        />
      </div>
      <Footer />
    </div>
  );
};

export default Catalogue;
