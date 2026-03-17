const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const listRoutes = require('./routes/listRouter');
const reviewRoutes = require('./routes/reviewRouter');
const followRoutes = require('./routes/followRouter');

dotenv.config();

// configuration Firebase
if (process.env.FIRESTORE_EMULATOR_HOST) {
  admin.initializeApp({ projectId: 'demo-supcontent' });
  console.log("Connecté à l'émulateur Firebase (Docker)");
} else {
  try {
    const serviceAccount = require('./chemin/vers/notre/cle-firebase.json'); // a modif
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Connecté au vrai Firebase Cloud");
  } catch(err) {
    console.log("Attention: Fichier firebase-key.json introuvable. (Ignoré pour les tests locaux) : "/*, err*/);
    admin.initializeApp({projectId: 'demo-supcontent'});
  }
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
const errorHandler = require("./middlewares/errorHandlers");

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/follows', followRoutes);

// middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});