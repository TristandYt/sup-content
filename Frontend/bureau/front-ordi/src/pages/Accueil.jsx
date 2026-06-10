import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
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

const Accueil = ({
                   onGameClick,
                   onUserClick,
                   searchTerm,
                   user,
                   onAdminClick,
                   onOpenCatalogue,
                 }) => {
  const { t } = useTranslation();
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchType, setSearchType] = useState("games");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [upcomingGames, setUpcomingGames] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [upcomingHasMore, setUpcomingHasMore] = useState(true);
  const [upcomingLoadingMore, setUpcomingLoadingMore] = useState(false);
  const UPCOMING_PAGE_SIZE = 20;

  const [activeCategory, setActiveCategory] = useState("Tous");
  const PAGE_SIZE = 12;
  const [params, setParams] = useState({
    sortBy: "total_rating",
    sortOrder: "desc",
    genre: "",
    platform: "",
    style: "",
  });

  const upcomingRef = useRef(null);
  const paramsRef = useRef(params);
  const searchTermRef = useRef(searchTerm);
  const searchTypeRef = useRef(searchType);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);
  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);
  useEffect(() => {
    searchTypeRef.current = searchType;
  }, [searchType]);

  const CATEGORIES = [
    { label: "Tous", value: "", icon: "fa-solid fa-layer-group" },
    { label: "Combat", value: "4", icon: "fa-solid fa-hand-fist" },
    { label: "Shooter", value: "5", icon: "fa-solid fa-crosshairs" },
    { label: "RPG", value: "12", icon: "fa-solid fa-dragon" },
    { label: "Aventure", value: "31", icon: "fa-solid fa-compass" },
  ];

  const getImageUrl = (game) => {
    if (game.cover && game.cover.image_id) {
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`;
    }
    return defaultCover;
  };

  const scrollCarousel = (direction) => {
    if (upcomingRef.current) {
      upcomingRef.current.scrollBy({
        left: direction === "left" ? -620 : 620,
        behavior: "smooth",
      });
    }
  };

  const fetchResults = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const hasSearchTerm = searchTerm && searchTerm.trim() !== "";
      const api = auth.currentUser
          ? await authAxios()
          : axios.create({ baseURL: "http://localhost:3000/api" });

      if (searchType === "users") {
        const res = await api
            .get(`/search`, {
              params: {
                q: hasSearchTerm ? searchTerm.trim() : "",
                type: "users",
                page: 1,
                limit: PAGE_SIZE,
              },
            })
            .catch(() => ({ data: { results: { users: [] } } }));

        const newUsers = res.data.results?.users || [];
        setUsers(newUsers);
      } else {
        let endpoint;
        if (hasSearchTerm) {
          endpoint = "search";
        } else if (params.genre || params.platform || params.style) {
          endpoint = "filtered";
        } else {
          endpoint = "popular";
        }

        const queryParams = {
          page: 1,
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

        const res = await api.get(`/games/${endpoint}`, {
          params: queryParams,
        });

        const rawData = res.data;
        let newGames = [];
        if (Array.isArray(rawData)) newGames = rawData;
        else if (rawData.games) newGames = rawData.games;
        else if (rawData.results?.games) newGames = rawData.results.games;
        else if (rawData.results && Array.isArray(rawData.results))
          newGames = rawData.results;

        newGames = sortGamesLocally(newGames, params.sortBy, params.sortOrder);
        setGames(newGames);
      }
    } catch (err) {
      console.error("Erreur API:", err);
      setError(
          "Impossible de contacter le service de recherche. Vérifiez votre connexion.",
      );
    } finally {
      setLoading(false);
    }
  }, [searchTerm, params, searchType]);

  const sortGamesLocally = (gamesList, sortBy, sortOrder) => {
    if (!gamesList || gamesList.length === 0) return gamesList;

    const sorted = [...gamesList].sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case "name":
          valA = (a.name || "").toLowerCase();
          valB = (b.name || "").toLowerCase();
          return sortOrder === "asc"
              ? valA.localeCompare(valB)
              : valB.localeCompare(valA);

        case "first_release_date":
          valA = a.first_release_date || 0;
          valB = b.first_release_date || 0;
          break;

        case "total_rating":
        default:
          valA = a.total_rating || 0;
          valB = b.total_rating || 0;
          break;
      }

      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return sorted;
  };

  const fetchResults = useCallback(async () => {
    const currentParams = paramsRef.current;
    const currentSearchTerm = searchTermRef.current;
    const currentSearchType = searchTypeRef.current;

    setError(null);
    setLoading(true);

    try {
      const hasSearchTerm =
        currentSearchTerm && currentSearchTerm.trim() !== "";
      const api = auth.currentUser
        ? await authAxios()
        : axios.create({ baseURL: "http://localhost:3000/api" });

      if (currentSearchType === "users") {
        const res = await api
          .get(`/search`, {
            params: {
              q: hasSearchTerm ? currentSearchTerm.trim() : "",
              type: "users",
              page: 1,
              limit: PAGE_SIZE,
            },
          })
          .catch(() => ({ data: { results: { users: [] } } }));

        const newUsers = res.data.results?.users || [];
        setUsers(newUsers);
      } else {
        let endpoint;
        if (hasSearchTerm) {
          endpoint = "search";
        } else if (
          currentParams.genre ||
          currentParams.platform ||
          currentParams.style
        ) {
          endpoint = "filtered";
        } else {
          endpoint = "popular";
        }

        const queryParams = {
          page: 1,
          limit: PAGE_SIZE,
          sortBy: currentParams.sortBy || "total_rating",
          order: currentParams.sortOrder || "desc",
          sort: currentParams.sortBy || "total_rating",
          sortOrder: currentParams.sortOrder || "desc",
        };

        if (hasSearchTerm) queryParams.q = currentSearchTerm.trim();
        if (currentParams.genre) queryParams.genre = currentParams.genre;
        if (currentParams.platform)
          queryParams.platform = currentParams.platform;
        if (currentParams.style) queryParams.style = currentParams.style;

        const res = await api.get(`/games/${endpoint}`, {
          params: queryParams,
        });

        const rawData = res.data;
        let newGames = [];
        if (Array.isArray(rawData)) newGames = rawData;
        else if (rawData.games) newGames = rawData.games;
        else if (rawData.results?.games) newGames = rawData.results.games;
        else if (rawData.results && Array.isArray(rawData.results))
          newGames = rawData.results;

        newGames = sortGamesLocally(
          newGames,
          currentParams.sortBy,
          currentParams.sortOrder,
        );
        setGames(newGames);
      }
    } catch (err) {
      console.error("Erreur API:", err);
      setError(
        "Impossible de contacter le service de recherche. Vérifiez votre connexion.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setGames([]);
    setUsers([]);
  }, [searchType]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchResults();
    }, 400);
    return () => clearTimeout(delay);
  }, [searchTerm, params, searchType]);

  const fetchUpcoming = useCallback(async (targetPage = 1, append = false) => {
    if (append) setUpcomingLoadingMore(true);
    else setUpcomingLoading(true);

    try {
      const api = auth.currentUser
          ? await authAxios()
          : axios.create({ baseURL: "http://localhost:3000/api" });

      const res = await api.get("/games/upcoming", {
        params: { page: targetPage, limit: UPCOMING_PAGE_SIZE },
      });

      const newGames = res.data || [];
      setUpcomingGames(append ? (prev) => [...prev, ...newGames] : newGames);
      setUpcomingHasMore(newGames.length === UPCOMING_PAGE_SIZE);
      setUpcomingPage(targetPage);

      if (append) {
        setTimeout(() => {
          if (upcomingRef.current) {
            upcomingRef.current.scrollBy({ left: 620, behavior: "smooth" });
          }
        }, 100);
      }
    } catch (err) {
      console.error("Erreur fetchUpcomingGames:", err);
    } finally {
      setUpcomingLoading(false);
      setUpcomingLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcoming(1, false);
  }, [user?.uid]);

  const handleCategoryChange = (value) => {
    setActiveCategory(
        CATEGORIES.find((c) => c.value === value)?.label || "Tous",
    );
    setParams((prev) => ({ ...prev, genre: value }));
  };

  return (
      <div className="accueil-container">
        <div className="hero-section">
          <div className="hero-gradient"></div>
          <div className="hero-content">
            <h2 className="hero-title">Découvrez les meilleurs jeux</h2>
            <p className="hero-subtitle">
              Tout le contenu sur TGMF à portée de clic. Explorez, filtrez et trouvez votre prochain jeu préféré.
            </p>
          </div>
        </div>

        <div className="categories-nav" style={{ marginBottom: "1rem" }}>
          <button
              className={`category-btn ${searchType === "games" ? "active" : ""}`}
              onClick={() => setSearchType("games")}
          >
            <i className="fa-solid fa-gamepad" style={{ marginRight: "8px" }}></i> Jeux
          </button>
          <button
              className={`category-btn ${searchType === "users" ? "active" : ""}`}
              onClick={() => setSearchType("users")}
          >
            <i className="fa-solid fa-users" style={{ marginRight: "8px" }}></i> Membres
          </button>
          {user?.role === "admin" && (
              <button
                  className="category-btn"
                  style={{ borderColor: "#a78bfa", color: "#a78bfa" }}
                  onClick={onAdminClick}
              >
                <i className="fa-solid fa-lock" style={{ marginRight: "6px" }}></i> Administration
              </button>
          )}
        </div>

        {searchType === "games" && (
            <div className="categories-nav">
              {CATEGORIES.map((category) => (
                  <button
                      key={category.value}
                      onClick={() => handleCategoryChange(category.value)}
                      className={`category-btn ${
                          activeCategory === category.label ? "active" : ""
                      }`}
                  >
                    <i className={category.icon} style={{ marginRight: "6px" }}></i>
                    {category.label}
                  </button>
              ))}
            </div>
        )}

        {/* ── FILTRES (On garde les EMOJIS natifs ici car les icônes FontAwesome cassent dans un <select>) ── */}
        {searchType === "games" && (
            <div className="filters-section">
              <div className="filters-container">
                <select
                    value={params.platform}
                    onChange={(e) => setParams((prev) => ({ ...prev, platform: e.target.value }))}
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
                    onChange={(e) => setParams((prev) => ({ ...prev, style: e.target.value }))}
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
                    onChange={(e) => setParams((prev) => ({ ...prev, sortBy: e.target.value }))}
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
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <i className={params.sortOrder === "asc" ? "fa-solid fa-arrow-up-wide-short" : "fa-solid fa-arrow-down-wide-short"}></i>
                  {params.sortOrder === "asc" ? "Croissant" : "Décroissant"}
                </button>
              </div>
            </div>
        )}

        <div className="section-header">
          <div className="section-icon">
            {searchType === "games" ? (
                <i className="fa-solid fa-fire" style={{ color: "rgb(239, 68, 68)" }}></i>
            ) : (
                <i className="fa-solid fa-users" style={{ color: "rgb(59, 130, 246)" }}></i>
            )}
          </div>
          <h3 className="section-title">
            {searchTerm
                ? `Résultats pour "${searchTerm}"`
                : searchType === "games"
                    ? "Tendances mondiales"
                    : "Membres de la communauté"}
          </h3>
        </div>

        {loading && games.length === 0 && users.length === 0 ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Chargement en cours...</p>
            </div>
        ) : error ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fa-solid fa-xmark" style={{ color: "rgb(239, 68, 68)" }}></i>
              </div>
              <h3 className="empty-title">Erreur de connexion</h3>
              <p className="empty-text">{error}</p>
            </div>
        ) : (searchType === "games" ? games.length : users.length) === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                {searchType === "games" ? (
                    <i className="fa-solid fa-gamepad" style={{ color: "rgb(148, 163, 184)" }}></i>
                ) : (
                    <i className="fa-solid fa-user" style={{ color: "rgb(148, 163, 184)" }}></i>
                )}
              </div>
              <h3 className="empty-title">Aucun résultat</h3>
              <p className="empty-text">Essayez de modifier vos filtres ou votre recherche</p>
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
                          {game.total_rating && (
                              <div className="rating-badge">
                        <span className="rating-star">
                          <i className="fa-solid fa-star" style={{ color: "rgb(255, 212, 59)" }}></i>
                        </span>
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
                            {game.genres && game.genres.length > 0 && (
                                <span className="game-genre">{game.genres[0].name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                  ))
                  : users.map((u) => (
                      <div
                          key={u.id || u.uid}
                          className="game-card-modern"
                          style={{ cursor: "pointer" }}
                          onClick={() => onUserClick && onUserClick(u.id || u.uid)}
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
                                  u.photoURL ||
                                  `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username || u.pseudo}`
                              }
                              alt={u.username || u.pseudo}
                              className="game-image"
                          />
                        </div>
                        <div
                            className="game-content"
                            style={{ textAlign: "center", paddingBottom: "20px" }}
                        >
                          <h3 className="game-title">{u.username || u.pseudo}</h3>
                          <p className="game-genre" style={{ fontSize: "0.8rem" }}>
                            {u.bio || "Joueur passionné"}
                          </p>
                        </div>
                      </div>
                  ))}
            </div>
        )}

        {/* ── Bouton catalogue ── */}
        {searchType === "games" &&
            !searchTerm &&
            games.length > 0 &&
            onOpenCatalogue && (
                <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "40px",
                      padding: "20px",
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                    }}
                >
                  <button
                      className="category-btn active"
                      onClick={onOpenCatalogue}
                      style={{ padding: "12px 60px", fontSize: "1rem" }}
                  >
                    Voir tout le catalogue
                  </button>
                </div>
            )}

        {/* ── Jeux à venir ── */}
        {searchType === "games" && !searchTerm && (
            <div style={{ marginTop: "3rem" }}>
              <div className="section-header">
                <div className="section-icon">
                  <i className="fa-solid fa-clock" style={{ color: "rgb(59, 130, 246)" }}></i>
                </div>
                <h3 className="section-title">Jeux à venir</h3>
              </div>

              {upcomingLoading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Chargement des jeux à venir...</p>
                  </div>
              ) : upcomingGames.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fa-solid fa-calendar" style={{ color: "rgb(148, 163, 184)" }}></i>
                    </div>
                    <h3 className="empty-title">Aucun jeu à venir</h3>
                    <p className="empty-text">Restez à l'écoute, de nouveaux titres arrivent bientôt !</p>
                  </div>
              ) : (
                  <div style={{ position: "relative", padding: "0 28px" }}>
                    <button
                        onClick={() => scrollCarousel("left")}
                        style={{
                          position: "absolute",
                          left: "0",
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 10,
                          background: "rgba(20,20,35,0.92)",
                          border: "1px solid rgba(167,139,250,0.3)",
                          borderRadius: "50%",
                          width: "40px",
                          height: "40px",
                          cursor: "pointer",
                          color: "#a78bfa",
                          fontSize: "1.3rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                        }}
                    >
                      <i className="fa-solid fa-chevron-left"></i>
                    </button>

                    <div
                        ref={upcomingRef}
                        style={{
                          display: "flex",
                          gap: "14px",
                          overflowX: "auto",
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                          paddingBottom: "8px",
                        }}
                    >
                      {upcomingGames.map((game) => (
                          <div
                              key={game.id}
                              onClick={() => onGameClick(game.id)}
                              className="game-card-modern"
                              style={{
                                minWidth: "160px",
                                maxWidth: "160px",
                                flexShrink: 0,
                              }}
                          >
                            <div className="game-image-container">
                              <img
                                  src={getImageUrl(game)}
                                  alt={game.name}
                                  className="game-image"
                              />
                              <div className="game-overlay"></div>
                              {game.total_rating && (
                                  <div className="rating-badge">
                          <span className="rating-star">
                            <i className="fa-solid fa-star" style={{ color: "rgb(255, 212, 59)" }}></i>
                          </span>
                                    <span className="rating-value">
                            {(game.total_rating / 20).toFixed(1)}
                          </span>
                                  </div>
                              )}
                            </div>
                            <div className="game-content">
                              <h3 className="game-title" style={{ fontSize: "0.8rem" }}>
                                {game.name}
                              </h3>
                              <div className="game-meta">
                        <span className="game-year">
                          {game.first_release_date
                              ? new Date(game.first_release_date * 1000).getFullYear()
                              : "TBA"}
                        </span>
                              </div>
                            </div>
                          </div>
                      ))}

                      {upcomingHasMore && (
                          <div
                              style={{
                                minWidth: "160px",
                                maxWidth: "160px",
                                flexShrink: 0,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: upcomingLoadingMore ? "default" : "pointer",
                                border: "1px solid rgba(167,139,250,0.3)",
                                borderRadius: "12px",
                                gap: "10px",
                                color: "#a78bfa",
                                opacity: upcomingLoadingMore ? 0.6 : 1,
                                transition: "all 0.2s",
                              }}
                              onClick={() => {
                                if (!upcomingLoadingMore) fetchUpcoming(upcomingPage + 1, true);
                              }}
                          >
                            {upcomingLoadingMore ? (
                                <>
                                  <div className="loading-spinner" style={{ width: "24px", height: "24px" }} />
                                  <span style={{ fontSize: "0.75rem" }}>Chargement...</span>
                                </>
                            ) : (
                                <>
                        <span style={{ fontSize: "1.8rem" }}>
                          <i className="fa-solid fa-circle-plus"></i>
                        </span>
                                  <span style={{ fontSize: "0.75rem", textAlign: "center", padding: "0 10px" }}>
                          Voir plus
                        </span>
                                </>
                            )}
                          </div>
                      )}
                    </div>

                    <button
                        onClick={() => scrollCarousel("right")}
                        style={{
                          position: "absolute",
                          right: "0",
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 10,
                          background: "rgba(20,20,35,0.92)",
                          border: "1px solid rgba(167,139,250,0.3)",
                          borderRadius: "50%",
                          width: "40px",
                          height: "40px",
                          cursor: "pointer",
                          color: "#a78bfa",
                          fontSize: "1.3rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                        }}
                    >
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
              )}
            </div>
        )}

        <style>{`
        div[style*="overflowX: auto"]::-webkit-scrollbar { display: none; }
      `}</style>
      </div>
  );
};

export default Accueil;