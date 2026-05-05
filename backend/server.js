/*
 * Backend Express principal.
 * Port 3000
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
const searchRoutes       = require('./Routes/searchRouter');
const notificationRoutes = require('./Routes/notificationRouter');
const moderationRoutes   = require('./Routes/moderationRouter');
const interactionRoutes  = require('./Routes/interactionsRouter');

// Routes publiques (pas d'auth globale ici)
app.use('/api/auth',   authRoutes);
app.use('/api/games',  gameRoutes);
app.use('/api/search', searchRoutes);

// /api/reviews : GET /game/:gameId est publique (géré dans le router lui-même)
// On NE met PAS authMiddleware ici pour laisser le router gérer sa propre sécurité
app.use('/api/reviews', reviewRoutes);

// Routes avec auth
app.use('/api/users',         authMiddleware, ensureFirestoreProfile, userRoutes);
app.use('/api/lists',         authMiddleware, ensureFirestoreProfile, listRoutes);
app.use('/api/follows',       authMiddleware, ensureFirestoreProfile, followRoutes);
app.use('/api/feeds',         authMiddleware, ensureFirestoreProfile, feedRoutes);
app.use('/api/conversations', authMiddleware, ensureFirestoreProfile, conversationRoutes);
app.use('/api/notifications', authMiddleware, ensureFirestoreProfile, notificationRoutes);
app.use('/api/moderation',    authMiddleware, ensureFirestoreProfile, moderationRoutes);
app.use('/api/interactions',  authMiddleware, ensureFirestoreProfile, interactionRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
