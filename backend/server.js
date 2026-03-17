const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- IMPORT DES ROUTES ---
const authRoutes = require('./Routes/authRoutes');
const gameRoutes = require('./Routes/gameRoutes.jsx');

// --- UTILISATION DES ROUTES ---
app.use('/api/auth', authRoutes);   
app.use('/api/games', gameRoutes); 

const PORT = 3000;
app.listen(PORT, () => console.log(`Serveur sur le port ${PORT}`));