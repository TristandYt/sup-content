/*
 * Backend Express principal.
 * Port 3000
 */
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");

dotenv.config();

require("./Services/Firebase");

const app = express();
const PORT = process.env.PORT || 3000;

// Sécurité des en-têtes HTTP
app.use(helmet());

// Définition dynamique des origines CORS depuis le fichier .env
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(",") 
  : [
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ];

// Configuration CORS stricte
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

app.use(express.json());

// Configuration Swagger
const yaml = require("yamljs");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = yaml.load("./swagger.yaml");
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "SupContent API Docs"
}));

const authMiddleware = require("./middlewares/auth");
const ensureFirestoreProfile = require("./middlewares/ensureFirestoreProfile");
const errorHandler = require("./middlewares/errorHandlers");

const authRoutes = require("./Routes/authRouter");
const gameRoutes = require("./Routes/games");
const userRoutes = require("./Routes/usersRouter");
const listRoutes = require("./Routes/listRouter");
const reviewRoutes = require("./Routes/reviewRouter");
const followRoutes = require("./Routes/followRouter");
const feedRoutes = require("./Routes/feedRouter");
const conversationRoutes = require("./Routes/conversationRouter");
const searchRoutes = require("./Routes/searchRouter");
const notificationRoutes = require("./Routes/notificationRouter");
const moderationRoutes = require("./Routes/moderationRouter");
const interactionRoutes = require("./Routes/interactionsRouter");
const forumRoutes = require("./Routes/forumRouter");

// Routes publiques
app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/reviews", reviewRoutes);

// Routes avec auth
app.use("/api/users", userRoutes);
app.use("/api/lists", authMiddleware, ensureFirestoreProfile, listRoutes);
app.use("/api/follows", authMiddleware, ensureFirestoreProfile, followRoutes);
app.use("/api/feeds", authMiddleware, ensureFirestoreProfile, feedRoutes);
app.use("/api/conversations",authMiddleware,ensureFirestoreProfile,conversationRoutes,);
app.use("/api/notifications",authMiddleware,ensureFirestoreProfile,notificationRoutes,);
app.use("/api/moderation",authMiddleware,ensureFirestoreProfile,moderationRoutes,);
app.use("/api/interactions",authMiddleware,ensureFirestoreProfile,interactionRoutes,);
app.use("/api/forum", authMiddleware, ensureFirestoreProfile, forumRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
