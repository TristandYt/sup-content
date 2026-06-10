import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { auth } from "../Service/firebase";
import "../../Style/Styles.css";
import defaultCover from "../assets/fr-default-large_default.jpg";

const authAxios = async () => {
  const token = await auth.currentUser?.getIdToken(true);
  return axios.create({
    baseURL: "http://localhost:3000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

const PAGE_SIZE = 35;

const PaginationBar = ({ page, hasMore, loading, onPageChange }) => {
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

const CATEGORIES = [
  { label: "Tous", value: "", icon: "fa-solid fa-layer-group" },
  { label: "Combat", value: "4", icon: "fa-solid fa-hand-fist" },
  { label: "Shooter", value: "5", icon: "fa-solid fa-crosshairs" },
  { label: "RPG", value: "12", icon: "fa-solid fa-dragon" },
  { label: "Aventure", value: "31", icon: "fa-solid fa-compass" },
];

const Catalogue = ({ onGameClick, user, searchTerm }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- 1. Persistance globale via l'URL (Page ET Filtres) ---
  const urlPage = parseInt(searchParams.get("page") || "1", 10);
  const urlGenre = searchParams.get("genre") || "";
  const urlPlatform = searchParams.get("platform") || "";
  const urlSortBy = searchParams.get("sortBy") || "total_rating";
  const urlSortOrder = searchParams.get("sortOrder") || "desc";

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(urlPage);
  const [hasMore, setHasMore] = useState(true);

  const [params, setParams] = useState({
    sortBy: urlSortBy,
    sortOrder: urlSortOrder,
    genre: urlGenre,
    platform: urlPlatform,
    style: "",
  });

  const [activeCategory, setActiveCategory] = useState(
    CATEGORIES.find((c) => c.value === urlGenre)?.label || "Tous",
  );

  const paramsRef = useRef(params);
  const searchTermRef = useRef(searchTerm);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  const getImageUrl = (game) => {
    if (game.cover?.image_id)
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`;
    return defaultCover;
  };

  const fetchGames = useCallback(
    async (targetPage = 1) => {
      setError(null);
      setLoading(true);

      const currentParams = paramsRef.current;
      const currentSearchTerm = searchTermRef.current;

      // Mettre à jour l'ensemble des paramètres dans l'URL
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", String(targetPage));
        if (currentParams.genre) next.set("genre", currentParams.genre);
        else next.delete("genre");
        if (currentParams.platform)
          next.set("platform", currentParams.platform);
        else next.delete("platform");
        next.set("sortBy", currentParams.sortBy);
        next.set("sortOrder", currentParams.sortOrder);
        return next;
      });

      try {
        const api = auth.currentUser
          ? await authAxios()
          : axios.create({ baseURL: "http://localhost:3000/api" });

        const hasSearchTerm = currentSearchTerm?.trim() !== "";
        const endpoint = hasSearchTerm
          ? "search"
          : currentParams.genre || currentParams.platform || currentParams.style
            ? "filtered"
            : "popular";

        const res = await api.get(`/games/${endpoint}`, {
          params: {
            page: targetPage,
            limit: PAGE_SIZE,
            sortBy: currentParams.sortBy,
            order: currentParams.sortOrder,
            ...(hasSearchTerm && { q: currentSearchTerm.trim() }),
            ...(currentParams.genre && { genre: currentParams.genre }),
            ...(currentParams.platform && { platform: currentParams.platform }),
            ...(currentParams.style && { style: currentParams.style }),
          },
        });

        const raw = res.data;
        let newGames = [];
        if (Array.isArray(raw)) newGames = raw;
        else if (raw.games) newGames = raw.games;
        else if (raw.results?.games) newGames = raw.results.games;
        else if (raw.results && Array.isArray(raw.results))
          newGames = raw.results;

        const more = newGames.length === PAGE_SIZE;

        setGames(newGames);
        setHasMore(more);
        setPage(targetPage);
      } catch (err) {
        setError("Impossible de charger les jeux.");
      } finally {
        setLoading(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [setSearchParams],
  );

  // --- 2. Gestion unifiée du cycle de vie (Correction du Bug) ---
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Au premier montage, on charge directement la page et les filtres issus de l'URL
      fetchGames(urlPage);
      return;
    }

    // Quand l'utilisateur modifie un filtre ou recherche → retour page 1 avec debounce
    setPage(1);
    const delay = setTimeout(() => {
      fetchGames(1);
    }, 400);
    return () => clearTimeout(delay);
  }, [params, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  // Remonter en haut automatiquement lors des changements de page manuels
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const handleCategoryChange = (value) => {
    setActiveCategory(
      CATEGORIES.find((c) => c.value === value)?.label || "Tous",
    );
    setParams((prev) => ({ ...prev, genre: value }));
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
            onClick={() => handleCategoryChange(c.value)}
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
            <option value="167">🎮 PlayStation 5</option>
            <option value="169">🎮 Xbox Series</option>
          </select>
          <select
            value={params.sortBy}
            onChange={(e) =>
              setParams((p) => ({ ...p, sortBy: e.target.value }))
            }
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
            {params.sortOrder === "asc" ? "Croissant" : "Décroissant"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
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
    </div>
  );
};

export default Catalogue;
