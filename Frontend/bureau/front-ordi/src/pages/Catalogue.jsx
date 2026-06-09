import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    background: "transparent",
    color: "#c4b5fd",
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: "all 0.15s",
  };
  const btnActive = {
    ...btnBase,
    background: "rgba(167,139,250,0.25)",
    border: "1px solid #a78bfa",
    color: "#fff",
    fontWeight: "600",
  };
  const btnDisabled = { ...btnBase, opacity: 0.35, cursor: "default" };

  const getPageNumbers = () => {
    const last = estimatedTotal;
    const pages = new Set();
    pages.add(1);
    for (let i = Math.max(2, page - 1); i <= Math.min(last - 1, page + 1); i++)
      pages.add(i);
    if (last > 1) pages.add(last);
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("...");
      result.push(sorted[i]);
    }
    return result;
  };

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
        ‹ Précédent
      </button>
      {getPageNumbers().map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} style={{ color: "#6b7280", padding: "8px 4px" }}>
            …
          </span>
        ) : (
          <button
            key={p}
            style={p === page ? btnActive : loading ? btnDisabled : btnBase}
            disabled={loading}
            onClick={() => p !== page && onPageChange(p)}
            onMouseEnter={(e) => {
              if (p !== page && !loading) {
                e.currentTarget.style.background = "rgba(167,139,250,0.12)";
                e.currentTarget.style.borderColor = "rgba(167,139,250,0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (p !== page && !loading) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              }
            }}
          >
            {p}
          </button>
        ),
      )}
      <button
        style={!hasMore || loading ? btnDisabled : btnBase}
        disabled={!hasMore || loading}
        onClick={() => onPageChange(page + 1)}
        onMouseEnter={(e) => {
          if (hasMore && !loading) {
            e.currentTarget.style.background = "rgba(167,139,250,0.12)";
            e.currentTarget.style.borderColor = "rgba(167,139,250,0.5)";
          }
        }}
        onMouseLeave={(e) => {
          if (hasMore && !loading) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
          }
        }}
      >
        Suivant ›
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
  const [estimatedTotal, setEstimatedTotal] = useState(10);
  const [params, setParams] = useState({
    sortBy: "total_rating",
    sortOrder: "desc",
    genre: "",
    platform: "",
    style: "",
  });

  const CATEGORIES = [
    { label: "Tous", value: "" },
    { label: "Combat", value: "4" },
    { label: "Shooter", value: "5" },
    { label: "RPG", value: "12" },
    { label: "Aventure", value: "31" },
  ];
  const [activeCategory, setActiveCategory] = useState("Tous");

  // Refs stables pour éviter la boucle useCallback + useEffect
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

  // fetchGames avec dépendances vides → fonction stable, lit params via ref
  const fetchGames = useCallback(async (targetPage = 1) => {
    const currentParams = paramsRef.current;
    const currentSearchTerm = searchTermRef.current;

    setError(null);
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const api = auth.currentUser
        ? await authAxios()
        : axios.create({ baseURL: "http://localhost:3000/api" });

      const hasSearchTerm =
        currentSearchTerm && currentSearchTerm.trim() !== "";

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
          sort: currentParams.sortBy,
          sortOrder: currentParams.sortOrder,
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

      const backendTotal = raw.total || raw.totalPages || null;
      const more = newGames.length === PAGE_SIZE;

      setGames(newGames);
      setHasMore(more);
      setPage(targetPage);

      if (backendTotal) {
        setEstimatedTotal(Math.ceil(backendTotal / PAGE_SIZE));
      } else if (!more) {
        setEstimatedTotal(targetPage);
      } else {
        setEstimatedTotal((prev) =>
          Math.max(
            prev,
            targetPage + Math.max(3, Math.round(targetPage * 0.5)),
          ),
        );
      }
    } catch (err) {
      console.error("Erreur catalogue:", err);
      setError("Impossible de charger les jeux.");
    } finally {
      setLoading(false);
    }
  }, []); // ← dépendances vides : fonction stable

  // Déclenché uniquement quand params ou searchTerm changent (pas fetchGames)
  useEffect(() => {
    setEstimatedTotal(10);
    setPage(1);
    const delay = setTimeout(() => {
      fetchGames(1);
    }, 400);
    return () => clearTimeout(delay);
  }, [params, searchTerm]); // ← fetchGames retiré des dépendances

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
            {searchTerm
              ? `Résultats pour "${searchTerm}"`
              : "Catalogue complet"}
          </h2>
          <p className="hero-subtitle">
            {searchTerm
              ? `Découvrez les jeux correspondant à votre recherche dans notre base de données.`
              : "Explorez tous les jeux disponibles sur TGMF."}
          </p>
        </div>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        <button
          className="category-btn"
          onClick={() => navigate("/")}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          ← Retour à l'accueil
        </button>
      </div>

      {/* Catégories */}
      <div className="categories-nav" style={{ marginTop: "20px" }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => handleCategoryChange(c.value)}
            className={`category-btn ${activeCategory === c.label ? "active" : ""}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filters-container">
          <select
            value={params.platform}
            onChange={(e) =>
              setParams((p) => ({ ...p, platform: e.target.value }))
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
            className="filter-select sort-btn"
          >
            {params.sortOrder === "asc" ? "↑ Croissant" : "↓ Décroissant"}
          </button>
        </div>
      </div>

      {/* Grille */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Chargement en cours...</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h3 className="empty-title">Erreur</h3>
          <p className="empty-text">{error}</p>
        </div>
      ) : games.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎮</div>
          <h3 className="empty-title">Aucun résultat</h3>
          <p className="empty-text">Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <>
          <div
            style={{
              padding: "0 20px",
              marginBottom: "8px",
              color: "#64748b",
              fontSize: "0.85rem",
            }}
          >
            Page {page} · {games.length} jeux affichés
          </div>
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
                  <div className="game-overlay" />
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
                        ? new Date(game.first_release_date * 1000).getFullYear()
                        : "TBA"}
                    </span>
                    {game.genres?.length > 0 && (
                      <span className="game-genre">{game.genres[0].name}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {games.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "40px 20px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            marginTop: "20px",
          }}
        >
          <PaginationBar
            page={page}
            estimatedTotal={estimatedTotal}
            hasMore={hasMore}
            loading={loading}
            onPageChange={fetchGames}
          />
        </div>
      )}
    </div>
  );
};

export default Catalogue;
