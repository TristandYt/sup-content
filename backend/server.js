const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const listRoutes = require('./routes/listRouter');
const reviewRoutes = require('./routes/reviewRouter');
const followRoutes = require('./routes/followRouter');
const feedRoutes = require('./routes/feedRouter');

dotenv.config();

// configuration Firebase
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'demo-supcontent'
    });
}
console.log("✅ Firebase Admin initialisé pour l'émulateur");

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
app.use('/api/feeds', feedRoutes);

// middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});