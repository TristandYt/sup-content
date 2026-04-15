/*
 * Backend Express principal.
 * Configure le serveur, les middleware, les routes et le gestionnaire d'erreurs.
 */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { admin, db, auth } = require('./Services/Firebase');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./Routes/authRouter');
const gameRoutes = require('./Routes/games');
const userRoutes = require('./Routes/usersRouter');
const listRoutes = require('./Routes/listRouter');
const reviewRoutes = require('./Routes/reviewRouter');
const followRoutes = require('./Routes/followRouter');
const feedRoutes = require('./Routes/feedRouter');
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