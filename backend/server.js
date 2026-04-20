/*
 * Backend Express principal.
 * Port 3000 (mappé depuis docker-compose → hôte:3000)
 */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

require('./Services/Firebase');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const authMiddleware          = require('./middlewares/auth');
const ensureFirestoreProfile  = require('./middlewares/ensureFirestoreProfile');
const errorHandler            = require('./middlewares/errorHandlers');

const authRoutes         = require('./Routes/authRouter');
const gameRoutes         = require('./Routes/games');
const userRoutes         = require('./Routes/usersRouter');
const listRoutes         = require('./Routes/listRouter');
const reviewRoutes       = require('./Routes/reviewRouter');
const followRoutes       = require('./Routes/followRouter');
const feedRoutes         = require('./Routes/feedRouter');
const conversationRoutes = require('./Routes/conversationRouter');

// Routes publiques (pas d'auth globale)
app.use('/api/auth',  authRoutes);
app.use('/api/games', gameRoutes);

// Routes avec auth — ensureFirestoreProfile garantit que le profil Firestore
// existe même après un premier login OAuth2 (Google, GitHub, Facebook)
app.use('/api/users',         authMiddleware, ensureFirestoreProfile, userRoutes);
app.use('/api/lists',         authMiddleware, ensureFirestoreProfile, listRoutes);
app.use('/api/reviews',       authMiddleware, ensureFirestoreProfile, reviewRoutes);
app.use('/api/follows',       authMiddleware, ensureFirestoreProfile, followRoutes);
app.use('/api/feeds',         authMiddleware, ensureFirestoreProfile, feedRoutes);
app.use('/api/conversations', authMiddleware, ensureFirestoreProfile, conversationRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
