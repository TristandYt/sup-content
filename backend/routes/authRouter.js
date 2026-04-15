/*
 * Routes d'authentification.
 * Définit l'inscription et la connexion pour l'API.
 */
const express = require('express');
const router = express.Router();
const validateRequest = require('../middlewares/ValidateRequest');
const authController = require('../controllers/authController');

// const { registerSchema, loginSchema } = require('../validators/authValidator'); // A décommenter si tu as Zod

router.post('/register', /* validateRequest(registerSchema), */ authController.register);
router.post('/login', /* validateRequest(loginSchema), */ authController.login);

module.exports = router;