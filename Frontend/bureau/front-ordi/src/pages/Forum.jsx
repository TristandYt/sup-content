import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../Service/firebase";
import "../../Style/Styles.css";

const authAxios = async () => {
    const token = await auth.currentUser?.getIdToken(true);
    return axios.create({
        baseURL: "http://localhost:3000/api",
        headers: { Authorization: `Bearer ${token}` },
    });
};

/* ── Liste des genres génériques ── */
const GENRES = [
    { id: "genre-action", name: "Action / Aventure", icon: "⚔️" },
    { id: "genre-rpg", name: "RPG", icon: "🧙‍♂️" },
    { id: "genre-fps", name: "FPS / Shooter", icon: "🔫" },
    { id: "genre-strategie", name: "Stratégie / Gestion", icon: "♟️" },
    { id: "genre-sport", name: "Sport / Course", icon: "🏎️" },
    { id: "genre-autre", name: "Autre (Général)", icon: "💬" }
];

/* ── Dropdown jeu & genre ── */
const GameDropdown = ({ results, onSelect, searchTerm }) => (
    <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#0f172a", border: "1px solid rgba(147,51,234,0.35)", borderRadius: "12px", zIndex: 9999, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}>
        {!searchTerm && GENRES.map((genre) => (
            <div key={genre.id} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(147,51,234,0.2)", background: "rgba(147,51,234,0.05)" }} onMouseDown={() => onSelect({ id: genre.id, name: genre.name, isGenre: true, icon: genre.icon })} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(147,51,234,0.18)")} onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(147,51,234,0.05)")}>
                <div style={{ width: "28px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>{genre.icon}</div>
                <span style={{ color: "#c4b5fd", fontSize: "0.9rem", fontWeight: "bold" }}>Général : {genre.name}</span>
            </div>
        ))}
        {results.map((g) => (
            <div key={g.id} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }} onMouseDown={() => onSelect(g)} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(147,51,234,0.18)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                {g.cover?.image_id ? <img src={`https://images.igdb.com/igdb/image/upload/t_thumb/${g.cover.image_id}.jpg`} alt="" style={{ width: "28px", height: "36px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: "28px", height: "36px", borderRadius: "4px", background: "rgba(147,51,234,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}>🎮</div>}
                <span style={{ color: "#e2e8f0", fontSize: "0.9rem" }}>{g.name}</span>
            </div>
        ))}
    </div>
);

/* ── Modale création ── */
const CreateThreadModal = ({ user, onClose, onCreated }) => {
    const [newThread, setNewThread] = useState({ title: "", content: "", gameId: "", gameName: "", gameCoverId: "" });
    const [gameSearch, setGameSearch] = useState("");
    const [gameResults, setGameResults] = useState([]);
    const [showGameSugg, setShowGameSugg] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!gameSearch || gameSearch.length < 2) { setGameResults([]); setShowGameSugg(false); return; }
            try {
                const api = auth.currentUser ? await authAxios() : axios.create({ baseURL: "http://localhost:3000/api" });
                const res = await api.get(`/games/search?q=${encodeURIComponent(gameSearch)}&limit=6`);
                setGameResults(res.data || []); setShowGameSugg(true);
            } catch (_) {}
        }, 350);
        return () => clearTimeout(timer);
    }, [gameSearch]);

    const handleSubmit = async () => {
        if (!newThread.title.trim() || !newThread.content.trim() || !newThread.gameId) {
            alert("Veuillez remplir le titre, le contenu ET lier un jeu ou genre !");
            return;
        }
        setSubmitting(true);
        try {
            const api = await authAxios();
            await api.post("/forum/threads", { title: newThread.title, content: newThread.content, gameId: newThread.gameId, gameName: newThread.gameName, gameCoverId: newThread.gameCoverId || null, pseudo: user?.pseudo || user?.username, avatarUrl: user?.avatar || user?.photoURL });
            onCreated(); onClose();
        } catch { alert("Erreur."); } finally { setSubmitting(false); }
    };

    return (
        <>
            <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, backdropFilter: "blur(4px)" }} />
            <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1001, width: "90%", maxWidth: "560px", background: "#1a1a2e", borderRadius: "20px", padding: "28px", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
                <h3>✏️ Nouveau sujet</h3>
                <input className="filter-select" placeholder="Titre *" value={newThread.title} onChange={(e) => setNewThread({...newThread, title: e.target.value})} style={{ width: "100%", marginBottom: "15px" }} />
                <textarea className="filter-select" placeholder="Contenu *" value={newThread.content} onChange={(e) => setNewThread({...newThread, content: e.target.value})} style={{ width: "100%", height: "100px", marginBottom: "15px" }} />
                <label style={{ color: "#c4b5fd" }}>🎮 Jeu ou Genre lié *</label>
                {newThread.gameId ? (
                    <div style={{ padding: "10px", background: "rgba(147,51,234,0.12)", border: "1px solid rgba(147,51,234,0.4)", borderRadius: "10px", marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                        {newThread.gameCoverId && <img src={`https://images.igdb.com/igdb/image/upload/t_thumb/${newThread.gameCoverId}.jpg`} alt="" style={{ width: "24px", height: "30px" }} />}
                        <span>{newThread.gameName}</span> <button onClick={() => setNewThread({...newThread, gameId: "", gameName: "", gameCoverId: ""})}>✕</button>
                    </div>
                ) : (
                    <input className="filter-select" placeholder="Rechercher..." value={gameSearch} onChange={(e) => setGameSearch(e.target.value)} onFocus={() => setShowGameSugg(true)} style={{ width: "100%" }} />
                )}
                {showGameSugg && <GameDropdown results={gameResults} searchTerm={gameSearch} onSelect={(g) => { setNewThread(prev => ({ ...prev, gameId: String(g.id), gameName: g.name, gameCoverId: g.cover?.image_id || "" })); setGameSearch(g.name); setShowGameSugg(false); }} />}
                <button className="nav-user-btn" style={{ width: "100%", marginTop: "20px" }} onClick={handleSubmit} disabled={submitting}>Publier</button>
            </div>
        </>
    );
};

/* ── Forum principal ── */
const Forum = ({ user, onGameClick, initialThread = null }) => {
    const [threads, setThreads] = useState([]);
    const [selectedThread, setSelectedThread] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("list");
    const [newPostContent, setNewPostContent] = useState("");

    const fetchThreads = async () => {
        setLoading(true);
        try {
            const api = auth.currentUser ? await authAxios() : axios.create({ baseURL: "http://localhost:3000/api" });
            const res = await api.get("/forum/threads");
            if (res.data.success) setThreads(res.data.threads);
        } catch {} finally { setLoading(false); }
    };

    const fetchThreadDetail = async (thread) => {
        setLoading(true);
        setSelectedThread(thread);
        try {
            const api = auth.currentUser ? await authAxios() : axios.create({ baseURL: "http://localhost:3000/api" });
            const res = await api.get(`/forum/threads/${thread.id}/posts`);
            if (res.data.success) { setPosts(res.data.posts); setView("detail"); }
        } catch {} finally { setLoading(false); }
    };

    const handleAddPost = async (e) => {
        e.preventDefault();
        try {
            const api = await authAxios();
            await api.post("/forum/posts", { threadId: selectedThread.id, content: newPostContent, pseudo: user?.pseudo || user?.username, avatarUrl: user?.avatar || user?.photoURL });
            setNewPostContent("");
            fetchThreadDetail(selectedThread);
        } catch { alert("Erreur."); }
    };

    useEffect(() => { fetchThreads(); }, []);

    return (
        <div className="accueil-container">
            <div className="main-content-wrapper">
                {view === "list" ? (
                    <>
                        <div className="section-header"><h3>Discussions récentes</h3><button className="category-btn active" onClick={() => setShowCreateModal(true)}>+ Nouveau sujet</button></div>
                        <div className="comments-list-modern">
                            {threads.map((thread) => (
                                <div key={thread.id} className="game-card-modern" style={{ padding: "16px 20px", marginBottom: "10px", cursor: "pointer", transition: "border-color 0.2s", display: "flex", gap: "16px", alignItems: "flex-start" }} onClick={() => fetchThreadDetail(thread)}>
                                    <div style={{ flexShrink: 0 }}>
                                        {thread.gameCoverId ? <img src={`https://images.igdb.com/igdb/image/upload/t_thumb/${thread.gameCoverId}.jpg`} alt="cover" style={{ width: "45px", height: "60px", borderRadius: "6px", objectFit: "cover" }} /> : <div style={{ width: "45px", height: "60px", borderRadius: "6px", background: "rgba(147,51,234,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>{String(thread.gameId).startsWith('genre') ? '📁' : '🎮'}</div>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: "0 0 5px 0" }}>{thread.title}</h4>
                                        <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "4px 0", fontStyle: "italic", opacity: 0.8 }}>{thread.content.length > 100 ? `${thread.content.substring(0, 100)}...` : thread.content}</p>
                                        <div
                                            style={{ marginTop: "6px", fontSize: "0.75rem", color: "#c084fc", background: "rgba(147,51,234,0.12)", padding: "2px 8px", borderRadius: "6px", display: "inline-flex", cursor: String(thread.gameId).startsWith('genre') ? "default" : "pointer" }}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Empêche l'ouverture du thread
                                                if (!String(thread.gameId).startsWith('genre')) onGameClick(thread.gameId);
                                            }}
                                        >
                                            {String(thread.gameId).startsWith('genre') ? '📁' : '🎮'} {thread.gameName}
                                        </div>
                                    </div>
                                    <span className="game-genre" style={{ flexShrink: 0, fontSize: "0.75rem", alignSelf: "flex-start" }}>{thread.lastReplyAt?.seconds ? new Date(thread.lastReplyAt.seconds * 1000).toLocaleDateString() : "Récemment"}</span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="game-card-modern" style={{ padding: "20px" }}>
                        <button className="category-btn" onClick={() => setView("list")}>← Retour</button>
                        <div style={{ display: "flex", alignItems: "center", gap: "15px", margin: "20px 0" }}>
                            <img src={selectedThread.authorAvatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedThread.authorName}`} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
                            <div>
                                <h3 style={{ margin: 0 }}>{selectedThread.title}</h3>
                                <span style={{ fontSize: "0.8rem", color: "#9333ea" }}>Par {selectedThread.authorName}</span>
                                {selectedThread.gameName && (
                                    <div style={{ color: "#c084fc", marginTop: "5px", cursor: String(selectedThread.gameId).startsWith('genre') ? "default" : "pointer" }} onClick={() => !String(selectedThread.gameId).startsWith('genre') && onGameClick(selectedThread.gameId)}>🎮 {selectedThread.gameName}</div>
                                )}
                            </div>
                        </div>
                        <p style={{ lineHeight: "1.6", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "20px" }}>{selectedThread.content}</p>
                        <div className="section-header"><h4>Réponses</h4></div>
                        <div className="comments-list-modern">
                            {posts.map((post) => (
                                <div key={post.id} style={{ padding: "15px", marginBottom: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "10px" }}>
                                    <div style={{ fontWeight: "600", color: "#c084fc" }}>{post.authorName}</div>
                                    <p>{post.content}</p>
                                </div>
                            ))}
                        </div>
                        {user ? (
                            <form onSubmit={handleAddPost}>
                                <textarea className="filter-select" style={{ width: "100%", height: "80px" }} placeholder="Répondre..." value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} required />
                                <button type="submit" className="nav-user-btn">Répondre</button>
                            </form>
                        ) : <p>Connectez-vous pour répondre.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};
export default Forum;