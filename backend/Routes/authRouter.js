/*
 * Routes d'authentification.
 * Validation Zod activée sur register et login.
 */
const express = require('express');
const router = express.Router();
const validateRequest = require('../middlewares/ValidateRequest');
const authController = require('../controllers/authController');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const auth = require('../middlewares/auth');
const ensureFirestoreProfile = require('../middlewares/ensureFirestoreProfile');

router.post('/register',validateRequest(registerSchema),authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);

router.post('/oauth/callback', auth, ensureFirestoreProfile, authController.oauthCallback);

module.exports = router;
