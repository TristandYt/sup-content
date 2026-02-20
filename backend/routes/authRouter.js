/* --------- Auth router --------- */
const express = require('express');
const router = express.Router();

/* --------- import middleware --------- */
const validateRequest = require('../middlewares/validateRequest');
const authController = require('../controllers/AuthController');

/* --------- import schema zod --------- */
const { registerSchema, loginSchema } = require('../validators/authValidator');

/* --------- Register --------- */
router.post('/register', validateRequest(registerSchema), authController.register);

/* --------- Login --------- */
router.post('/login', validateRequest(loginSchema), authController.login);

module.exports = router;