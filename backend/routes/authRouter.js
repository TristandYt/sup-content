/* --------- Auth router --------- */
const express = require('express');
const router = express.Router();

/* --------- import middleware --------- */
const validateRequest = require('../middlewares/validateRequest');
const authController = require('../controllers/AuthController');

/* --------- import schema zod --------- */
const { registerSchema, loginSchema, socialLoginSchema } = require('../validators/authValidator');

/* --------- register --------- */
router.post('/register', validateRequest(registerSchema), authController.register);

/* --------- login --------- */
router.post('/login', validateRequest(loginSchema), authController.login);

/* --------- social login (google/facebook) --------- */
router.post('/social', validateRequest(socialLoginSchema), authController.socialLogin);

module.exports = router;