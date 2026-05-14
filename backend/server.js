/*
 * Backend Express principal.
 * Port 3000
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

require('./Services/Firebase');

const app = express();
const PORT = process.env.PORT || 3000;

// Sécurité des en-têtes HTTP
app.use(helmet());

// Configuration CORS stricte 
app.use(cors({
    origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));

// Limitation du taux de requêtes 
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, msg: "Trop de requêtes effectuées depuis cette IP, veuillez réessayer plus tard." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);

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
const forumRoutes        = require('./Routes/forumRouter');

// Routes publiques 
app.use('/api/auth',   authRoutes);
app.use('/api/games',  gameRoutes);
app.use('/api/search', searchRoutes);
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
app.use('/api/forum',         authMiddleware, ensureFirestoreProfile, forumRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
