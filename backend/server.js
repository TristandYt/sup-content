const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- IMPORT DES ROUTES ---
const authRoutes = require('./Routes/authRoutes');
const gameRoutes = require('./Routes/gameRoutes');

// --- UTILISATION DES ROUTES ---
app.use('/api/auth', authRoutes);   // Toutes les routes d'auth commenceront par /api/auth
app.use('/api/games', gameRoutes); // Toutes les routes de jeux par /api/games

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Serveur sur le port ${PORT}`));