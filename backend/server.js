const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

// Remarque : plus besoin de mongoose !

dotenv.config();

// Configuration Firebase
if (process.env.FIRESTORE_EMULATOR_HOST) {
  admin.initializeApp({ projectId: 'demo-supcontent' });
  console.log("🔥 Connecté à l'émulateur Firebase (Docker)");
} else {
  const serviceAccount = require('./chemin/vers/votre/cle-firebase.json'); // À ajuster plus tard
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("☁️ Connecté au vrai Firebase Cloud");
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRouter');
const gameRoutes = require('./routes/games');
const userRoutes = require('./routes/usersRouter');
const errorHandler = require("./middlewares/ErrorHandlers");

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});