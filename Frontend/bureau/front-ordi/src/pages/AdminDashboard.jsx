import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { auth } from "../Service/firebase";

const API = "http://localhost:3000/api";

const authAxios = async () => {
  const token = await auth.currentUser?.getIdToken(true);
  return axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` },
  });
};

const NAV = [
  { id: "overview", icon: "⬡", label: "Tableau de bord" },
  { id: "users", icon: "◈", label: "Membres" },
  { id: "roles", icon: "◉", label: "Rôles" },
  { id: "reports", icon: "◬", label: "Signalements" },
  { id: "reviews", icon: "◫", label: "Critiques" },
  { id: "logs", icon: "◌", label: "Logs système" },
];

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: toast.ok ? "#0d1f13" : "#1f0d0d",
        border: `1px solid ${toast.ok ? "#2a6e3f" : "#6e2a2a"}`,
        color: toast.ok ? "#6fcf97" : "#eb5757",
        padding: "10px 18px",
        borderRadius: 6,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <span>{toast.ok ? "✓" : "✗"}</span>
      <span>{toast.msg}</span>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div
      style={{
        background: "#111118",
        border: "1px solid #1e1e2a",
        borderRadius: 8,
        padding: "1.25rem 1.5rem",
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#555",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "#e8e8f0",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value ?? <span style={{ opacity: 0.3 }}>—</span>}
      </div>
    </div>
  );
}

function Badge({ type }) {
  const map = {
    admin: { bg: "#1a1535", color: "#a78bfa", label: "admin" },
    user: { bg: "#0d1a0d", color: "#6fcf97", label: "user" },
    banned: { bg: "#1f0d0d", color: "#eb5757", label: "banni" },
    actif: { bg: "#0d1a0d", color: "#6fcf97", label: "actif" },
    pending: { bg: "#1a130d", color: "#f2994a", label: "en attente" },
    on: { bg: "#1a1535", color: "#a78bfa", label: "mis en avant" },
    off: { bg: "#111", color: "#555", label: "normal" },
    comment: { bg: "#0d172a", color: "#38bdf8", label: "commentaire" },
    review: { bg: "#1e1b4b", color: "#818cf8", label: "critique" },
  };
  const s = map[type] || map.off;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.color}33`,
        borderRadius: 4,
        fontSize: 11,
        padding: "2px 8px",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {s.label}
    </span>
  );
}

function Btn({ children, onClick, variant = "default", disabled, small }) {
  const styles = {
    default: {
      border: "1px solid #2a2a3a",
      color: "#aaa",
      background: "transparent",
    },
    danger: {
      border: "1px solid #6e2a2a",
      color: "#eb5757",
      background: "transparent",
    },
    success: {
      border: "1px solid #2a6e3f",
      color: "#6fcf97",
      background: "transparent",
    },
    primary: {
      border: "1px solid #3a2a6e",
      color: "#a78bfa",
      background: "transparent",
    },
  };
  const s = styles[variant] || styles.default;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...s,
        borderRadius: 5,
        padding: small ? "3px 10px" : "6px 14px",
        fontSize: small ? 11 : 12,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "'JetBrains Mono', monospace",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function SectionTitle({ children }) {
  return (
    <h2
      style={{
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: "0.15em",
        color: "#555",
        fontFamily: "'JetBrains Mono', monospace",
        marginBottom: "1.5rem",
        borderBottom: "1px solid #1a1a24",
        paddingBottom: "0.75rem",
      }}
    >
      {children}
    </h2>
  );
}

function OverviewPanel({ logs, stats }) {
  return (
    <div>
      <SectionTitle>Tableau de bord</SectionTitle>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: "2rem",
        }}
      >
        <StatCard
          label="Logs enregistrés"
          value={stats.total}
          accent="#a78bfa"
        />
        <StatCard label="Promotions" value={stats.promoted} accent="#6fcf97" />
        <StatCard label="Banissements" value={stats.banned} accent="#eb5757" />
        <StatCard label="Suppressions" value={stats.deleted} accent="#f2994a" />
      </div>
      <div
        style={{
          background: "#111118",
          border: "1px solid #1a1a24",
          borderRadius: 8,
          padding: "1rem",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#555",
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Activité récente
        </div>
        {logs.slice(0, 8).map((l, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "140px 180px 1fr",
              gap: 12,
              padding: "7px 0",
              borderBottom: i < 7 ? "1px solid #111" : "none",
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span style={{ color: "#444" }}>{l._ts}</span>
            <span style={{ color: "#a78bfa" }}>{l.event}</span>
            <span style={{ color: "#555" }}>{l.userId}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div
            style={{
              color: "#333",
              fontSize: 12,
              textAlign: "center",
              padding: "1rem",
            }}
          >
            Aucun log
          </div>
        )}
      </div>
    </div>
  );
}

function UsersPanel({ showToast }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const normalizeUser = (u) => ({
    ...u,
    _id: u.userId || u.id || u.uid || null,
  });

  const searchUsers = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const api = await authAxios();
      const { data } = await api.get(`/search`, {
        params: { q: query.trim() },
      });
      if (data.success) {
        const users = (data.results?.users || []).map(normalizeUser);
        setResults(users);
        if (users.length === 0) showToast("Aucun utilisateur trouvé", false);
      } else {
        showToast("Erreur recherche", false);
      }
    } catch {
      showToast("Erreur serveur", false);
    }
    setQuery("");
  };

  const ban = async (userId) => {
    try {
      const api = await authAxios();
      const { data } = await api.post(`/moderation/users/${userId}/ban`);
      showToast(data.msg, data.success);
      if (data.success) {
        setResults((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isBanned: true } : u)),
        );
      }
    } catch {
      showToast("Erreur serveur", false);
    }
  };

  const promote = async (userId) => {
    try {
      const api = await authAxios();
      const { data } = await api.post(`/users/promote/${userId}`, {
        role: "admin",
      });
      showToast(data.msg, data.success);
      if (data.success) {
        setResults((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: "admin" } : u)),
        );
      }
    } catch {
      showToast("Erreur serveur", false);
    }
  };

  return (
    <div>
      <SectionTitle>Recherche membres</SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchUsers()}
          placeholder="Rechercher par pseudo (ex: Tristan)"
          style={{
            flex: 1,
            background: "#111118",
            border: "1px solid #1e1e2a",
            borderRadius: 6,
            color: "#ddd",
            padding: "8px 12px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
          }}
        />
        <Btn onClick={searchUsers} disabled={loading} variant="primary">
          {loading ? "…" : "◈ Rechercher"}
        </Btn>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {results.map((u) => (
          <div
            key={u._id}
            style={{
              background: "#111118",
              border: "1px solid #1e1e2a",
              borderRadius: 8,
              padding: "1.25rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{ fontSize: 18, color: "#e8e8f0", fontWeight: 500 }}
                >
                  {u.username || u.pseudo}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#555",
                    fontFamily: "'JetBrains Mono', monospace",
                    marginTop: 4,
                  }}
                >
                  {u._id}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge type={u.role === "admin" ? "admin" : "user"} />
                <Badge type={u.isBanned ? "banned" : "actif"} />
              </div>
            </div>
            {u.bio && (
              <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
                {u.bio}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {!u.isBanned && (
                <Btn variant="danger" onClick={() => ban(u._id)}>
                  ◬ Bannir
                </Btn>
              )}
              {u.role !== "admin" && (
                <Btn variant="success" onClick={() => promote(u._id)}>
                  ◉ Promouvoir
                </Btn>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RolesPanel({ showToast }) {
  const [promoteId, setPromoteId] = useState("");
  const [banId, setBanId] = useState("");
  const [loading, setLoading] = useState({ promote: false, ban: false });

  const doPromote = async () => {
    if (!promoteId.trim()) return;
    setLoading((l) => ({ ...l, promote: true }));
    try {
      const api = await authAxios();
      const { data } = await api.post(`/users/promote/${promoteId.trim()}`, {
        role: "admin",
      });
      showToast(data.msg, data.success);
      if (data.success) setPromoteId("");
    } catch {
      showToast("Erreur serveur", false);
    }
    setLoading((l) => ({ ...l, promote: false }));
  };

  const doBan = async () => {
    if (!banId.trim()) return;
    setLoading((l) => ({ ...l, ban: true }));
    try {
      const api = await authAxios();
      const { data } = await api.post(`/moderation/users/${banId.trim()}/ban`);
      showToast(data.msg, data.success);
      if (data.success) setBanId("");
    } catch {
      showToast("Erreur serveur", false);
    }
    setLoading((l) => ({ ...l, ban: false }));
  };

  const fieldStyle = {
    width: "100%",
    background: "#111118",
    border: "1px solid #1e1e2a",
    borderRadius: 6,
    color: "#ddd",
    padding: "9px 12px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    marginBottom: 8,
  };

  return (
    <div>
      <SectionTitle>Gestion des rôles</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div
          style={{
            background: "#111118",
            border: "1px solid #1e1e2a",
            borderRadius: 8,
            padding: "1.25rem",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#a78bfa",
              marginBottom: 12,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            ◉ Promouvoir Admin
          </div>
          <div style={{ fontSize: 11, color: "#444", marginBottom: 12 }}>
            POST /api/users/promote/:userId · body {'{ role: "admin" }'}
          </div>
          <input
            style={fieldStyle}
            placeholder="userId à promouvoir"
            value={promoteId}
            onChange={(e) => setPromoteId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doPromote()}
          />
          <Btn variant="success" onClick={doPromote} disabled={loading.promote}>
            {loading.promote ? "…" : "Promouvoir en administrateur"}
          </Btn>
        </div>

        <div
          style={{
            background: "#111118",
            border: "1px solid #1e1e2a",
            borderRadius: 8,
            padding: "1.25rem",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#eb5757",
              marginBottom: 12,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            ◬ Bannir un utilisateur
          </div>
          <div style={{ fontSize: 11, color: "#444", marginBottom: 12 }}>
            POST /api/moderation/users/:userId/ban · désactive Auth + Firestore
          </div>
          <input
            style={fieldStyle}
            placeholder="userId à bannir"
            value={banId}
            onChange={(e) => setBanId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doBan()}
          />
          <Btn variant="danger" onClick={doBan} disabled={loading.ban}>
            {loading.ban ? "…" : "Bannir définitivement"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function ReportsPanel({ showToast }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const api = await authAxios();
      const { data } = await api.get("/moderation/reports");
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch {
      showToast("Erreur de synchronisation des signalements", false);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const thStyle = {
    fontSize: 10,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    padding: "10px 12px",
    textAlign: "left",
    borderBottom: "1px solid #1a1a24",
    fontFamily: "'JetBrains Mono', monospace",
  };
  const tdStyle = {
    padding: "12px",
    borderBottom: "1px solid #111",
    fontSize: 13,
    color: "#aaa",
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <SectionTitle>Gestion des signalements</SectionTitle>
        <Btn small onClick={fetchReports} disabled={loading}>
          {loading ? "…" : "↺ Actualiser"}
        </Btn>
      </div>

      <div
        style={{
          background: "#111118",
          border: "1px solid #1e1e2a",
          borderRadius: 8,
          overflow: "hidden",
          marginBottom: "2rem",
        }}
      >
        {reports.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "#444",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
            }}
          >
            {loading
              ? "Chargement des signalements..."
              : "Aucun signalement en attente"}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>ID Cible</th>
                <th style={thStyle}>Motif</th>
                <th style={thStyle}>Auteur</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const dateStr = r.createdAt?._seconds
                  ? new Date(r.createdAt._seconds * 1000).toLocaleDateString(
                      "fr-FR",
                    )
                  : "—";
                return (
                  <tr key={r.id}>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "#555",
                      }}
                    >
                      {dateStr}
                    </td>
                    <td style={tdStyle}>
                      <Badge type={r.targetType || "comment"} />
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: "#888",
                      }}
                    >
                      {r.targetId}
                    </td>
                    <td style={{ ...tdStyle, color: "#e8e8f0" }}>{r.reason}</td>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: "#666",
                      }}
                    >
                      {r.reporterId}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div
        style={{
          background: "#111118",
          border: "1px solid #1e1e2a",
          borderRadius: 8,
          padding: "1.25rem",
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#eb5757",
            marginBottom: 16,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Action rapide — Prendre une mesure de bannissement
        </div>
        <BanFromReportForm showToast={showToast} />
      </div>
    </div>
  );
}

function BanFromReportForm({ showToast }) {
  const [uid, setUid] = useState("");
  const doBan = async () => {
    if (!uid.trim()) return;
    try {
      const api = await authAxios();
      // --- CORRECTION : Alignement de l'URL avec les préfixes du routeur de modération backend ---
      const { data } = await api.post(`/moderation/users/${uid.trim()}/ban`);
      showToast(data.msg, data.success);
      if (data.success) setUid("");
    } catch {
      showToast("Erreur", false);
    }
  };
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        value={uid}
        onChange={(e) => setUid(e.target.value)}
        placeholder="Saisir le userId du membre à bannir"
        onKeyDown={(e) => e.key === "Enter" && doBan()}
        style={{
          flex: 1,
          background: "#111",
          border: "1px solid #1e1e2a",
          borderRadius: 6,
          color: "#ddd",
          padding: "8px 12px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
        }}
      />
      <Btn variant="danger" onClick={doBan}>
        ◬ Bannir
      </Btn>
    </div>
  );
}

function ReviewsPanel({ showToast }) {
  const [reviews, setReviews] = useState([]);
  const [reviewId, setReviewId] = useState("");
  const [targetReviewId, setTargetReviewId] = useState("");
  const [targetCommentId, setTargetCommentId] = useState("");

  const addReviewById = (id) => {
    if (!id.trim()) return;
    if (reviews.find((r) => r.id === id.trim())) return;
    setReviews((prev) => [
      ...prev,
      { id: id.trim(), isHighlighted: false, loaded: false },
    ]);
    setReviewId("");
  };

  const deleteReview = async (id) => {
    if (!window.confirm(`Supprimer la critique ${id} ?`)) return;
    try {
      const api = await authAxios();
      const { data } = await api.delete(`/moderation/reviews/${id}`);
      showToast(data.msg, data.success);
      if (data.success) setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      showToast("Erreur serveur", false);
    }
  };

  const deleteCommentQuick = async () => {
    if (!targetReviewId.trim() || !targetCommentId.trim()) return;
    if (!window.confirm("Supprimer définitivement ce commentaire ?")) return;
    try {
      const api = await authAxios();
      const { data } = await api.delete(
        `/moderation/reviews/${targetReviewId.trim()}/comments/${targetCommentId.trim()}`,
      );
      showToast(data.msg, data.success);
      if (data.success) {
        setTargetCommentId("");
      }
    } catch {
      showToast("Erreur lors de la suppression du commentaire", false);
    }
  };

  const toggleHighlight = async (id) => {
    try {
      const api = await authAxios();
      const { data } = await api.patch(`/moderation/reviews/${id}/highlight`);
      showToast(data.msg, data.success);
      if (data.success)
        setReviews((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, isHighlighted: data.isHighlighted } : r,
          ),
        );
    } catch {
      showToast("Erreur serveur", false);
    }
  };

  const thStyle = {
    fontSize: 10,
    color: "#444",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    padding: "6px 12px",
    textAlign: "left",
    borderBottom: "1px solid #1a1a24",
    fontFamily: "'JetBrains Mono', monospace",
  };
  const tdStyle = {
    padding: "10px 12px",
    borderBottom: "1px solid #111",
    fontSize: 13,
  };

  return (
    <div>
      <SectionTitle>Modération des critiques</SectionTitle>

      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
        <input
          value={reviewId}
          onChange={(e) => setReviewId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addReviewById(reviewId)}
          placeholder="ID de la critique (reviewId Firestore)"
          style={{
            flex: 1,
            background: "#111118",
            border: "1px solid #1e1e2a",
            borderRadius: 6,
            color: "#ddd",
            padding: "8px 12px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
          }}
        />
        <Btn variant="primary" onClick={() => addReviewById(reviewId)}>
          + Ajouter
        </Btn>
      </div>

      {reviews.length === 0 ? (
        <div
          style={{
            background: "#111118",
            border: "1px solid #1e1e2a",
            borderRadius: 8,
            padding: "2rem",
            textAlign: "center",
            color: "#333",
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Saisir un reviewId ci-dessus pour agir dessus
        </div>
      ) : (
        <div
          style={{
            background: "#111118",
            border: "1px solid #1e1e2a",
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: "2rem",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Review ID</th>
                <th style={thStyle}>Statut</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td
                    style={{
                      ...tdStyle,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#888",
                    }}
                  >
                    {r.id}
                  </td>
                  <td style={tdStyle}>
                    <Badge type={r.isHighlighted ? "on" : "off"} />
                  </td>
                  <td style={{ ...tdStyle, display: "flex", gap: 6 }}>
                    <Btn
                      small
                      variant="primary"
                      onClick={() => toggleHighlight(r.id)}
                    >
                      {r.isHighlighted
                        ? "↓ Retirer mise en avant"
                        : "↑ Mettre en avant"}
                    </Btn>
                    <Btn
                      small
                      variant="danger"
                      onClick={() => deleteReview(r.id)}
                    >
                      ✕ Supprimer
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        style={{
          background: "#111118",
          border: "1px solid #1e1e2a",
          borderRadius: 8,
          padding: "1.25rem",
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#eb5757",
            marginBottom: 16,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          ✕ Action rapide — Supprimer un commentaire
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={targetReviewId}
            onChange={(e) => setTargetReviewId(e.target.value)}
            placeholder="ID de la critique"
            style={{
              flex: 1,
              background: "#111",
              border: "1px solid #1e1e2a",
              borderRadius: 6,
              color: "#ddd",
              padding: "8px 12px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
            }}
          />
          <input
            value={targetCommentId}
            onChange={(e) => setTargetCommentId(e.target.value)}
            placeholder="ID du commentaire"
            style={{
              flex: 1,
              background: "#111",
              border: "1px solid #1e1e2a",
              borderRadius: 6,
              color: "#ddd",
              padding: "8px 12px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
            }}
          />
          <Btn variant="danger" onClick={deleteCommentQuick}>
            ✕ Supprimer
          </Btn>
        </div>
      </div>
    </div>
  );
}

function LogsPanel({ logs, reload, loading }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <h2
          style={{
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "#555",
            fontFamily: "'JetBrains Mono', monospace",
            margin: 0,
          }}
        >
          Logs système
        </h2>
        <Btn onClick={reload} disabled={loading}>
          {loading ? "…" : "↺ Actualiser"}
        </Btn>
      </div>
      <div
        style={{ borderBottom: "1px solid #1a1a24", marginBottom: "1.5rem" }}
      />
      <div
        style={{
          background: "#0d0d14",
          border: "1px solid #1a1a24",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              color: "#333",
              fontSize: 12,
              textAlign: "center",
              padding: "2rem",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {loading ? "Chargement…" : "Aucun log"}
          </div>
        ) : (
          logs.map((l, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "160px 200px 1fr",
                gap: 16,
                padding: "8px 16px",
                borderBottom:
                  i < logs.length - 1 ? "1px solid #0f0f18" : "none",
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                background: i % 2 === 0 ? "transparent" : "#050508",
              }}
            >
              <span style={{ color: "#333" }}>{l._ts}</span>
              <span
                style={{
                  color: l.event?.includes("ban")
                    ? "#eb5757"
                    : l.event?.includes("promoted")
                      ? "#a78bfa"
                      : "#6fcf97",
                }}
              >
                {l.event}
              </span>
              <span
                style={{
                  color: "#444",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {l.userId}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard({ onBack }) {
  const [active, setActive] = useState("overview");
  const [toast, setToast] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: null,
    promoted: null,
    banned: null,
    deleted: null,
  });

  useEffect(() => {
    document.title = "Administration | TGMF";
  }, []);

  const showToast = useCallback((msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const api = await authAxios();
      const { data } = await api.get("/users/logs?limit=100");
      if (data.success) {
        const parsed = data.logs.map((l) => ({
          ...l,
          _ts: l.timestamp?._seconds
            ? new Date(l.timestamp._seconds * 1000).toLocaleString("fr-FR", {
                hour12: false,
              })
            : "—",
        }));
        setLogs(parsed);
        setStats({
          total: parsed.length,
          promoted: parsed.filter((l) => l.event === "user_promoted").length,
          banned: parsed.filter((l) => l.event === "user_banned").length,
          deleted: parsed.filter((l) => l.event === "admin_deleted_review")
            .length,
        });
      }
    } catch {
      showToast("Impossible de charger les logs", false);
    }
    setLogsLoading(false);
  }, [showToast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const panels = {
    overview: <OverviewPanel logs={logs} stats={stats} />,
    users: <UsersPanel showToast={showToast} />,
    roles: <RolesPanel showToast={showToast} />,
    reports: <ReportsPanel showToast={showToast} />,
    reviews: <ReviewsPanel showToast={showToast} />,
    logs: <LogsPanel logs={logs} reload={loadLogs} loading={logsLoading} />,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #333; }
        input:focus { outline: none; border-color: #2a2a4a !important; }
        button:hover:not(:disabled) { opacity: 0.85; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#0a0a0f",
          color: "#c8c8d8",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            background: "#0d0d14",
            borderRight: "1px solid #12121e",
            display: "flex",
            flexDirection: "column",
            padding: "1.5rem 0",
          }}
        >
          <div
            style={{
              padding: "0 1.25rem 1.5rem",
              borderBottom: "1px solid #12121e",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#333",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Système
            </div>
            <div style={{ fontSize: 16, color: "#e8e8f0", fontWeight: 500 }}>
              Admin Panel
            </div>
          </div>

          <nav style={{ flex: 1, padding: "1rem 0" }}>
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 1.25rem",
                  cursor: "pointer",
                  textAlign: "left",
                  color: active === item.id ? "#e8e8f0" : "#444",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: active === item.id ? 500 : 400,
                  borderLeft:
                    active === item.id
                      ? "2px solid #a78bfa"
                      : "2px solid transparent",
                  backgroundColor:
                    active === item.id
                      ? "rgba(167,139,250,0.05)"
                      : "transparent",
                  transition: "all 0.15s",
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: active === item.id ? "#a78bfa" : "#2a2a3a",
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>

          {onBack && (
            <div
              style={{
                padding: "1rem 1.25rem",
                borderTop: "1px solid #12121e",
              }}
            >
              <button
                onClick={onBack}
                style={{
                  background: "none",
                  border: "1px solid #1e1e2a",
                  borderRadius: 6,
                  color: "#444",
                  fontSize: 12,
                  padding: "6px 12px",
                  cursor: "pointer",
                  width: "100%",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                ← Retour au site
              </button>
            </div>
          )}
        </aside>

        <main
          style={{
            flex: 1,
            padding: "2rem 2.5rem",
            overflowY: "auto",
            maxHeight: "100vh",
          }}
        >
          <div style={{ maxWidth: 900 }}>{panels[active]}</div>
        </main>
      </div>

      <Toast toast={toast} />
    </>
  );
}
