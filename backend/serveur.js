const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURATION FIREBASE POUR DOCKER
if (process.env.FIRESTORE_EMULATOR_HOST) {
    // Si on est dans Docker, on se connecte à l'émulateur
    console.log("🚀 Connexion à l'émulateur Firestore sur:", process.env.FIRESTORE_EMULATOR_HOST);
    admin.initializeApp({
        projectId: "sup-content-tristan"
    });
} else {
    // Configuration Production (Firebase réel)
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

// Route de test
app.get('/', (req, res) => {
    res.send('Backend Sup Content opérationnel !');
});

// Exemple de route pour Firestore
app.get('/test-db', async (req, res) => {
    try {
        await db.collection('test').add({ date: new Date().toISOString() });
        res.status(200).send('Donnée ajoutée à Firestore via Docker !');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Serveur backend lancé sur http://localhost:${PORT}`);
});