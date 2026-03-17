const express = require('express');
const cors = require('cors');
const { db, auth } = require('./services/Firebase'); 
require('dotenv').config();

const app = express();

// Middlewares basiques
app.use(cors());
app.use(express.json());

// Route de base pour vérifier que l'API répond
app.get('/', (req, res) => {
    res.send("API Sup-Content Opérationnelle");
});

// Route test pour Firestore
app.get('/test', async (req, res) => {
    try {
        await db.collection('test').add({ 
            date: new Date().toISOString(), 
            user: "Tristan" 
        });
        res.send("Connexion Firestore OK (Document créé)");
    } catch (e) {
        res.status(500).send("Erreur de liaison : " + e.message);
    }
});

// Port d'écoute
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\nReady on http://localhost:${PORT}`);
});