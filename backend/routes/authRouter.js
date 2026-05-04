/*
 * Routes d'authentification.
 * Validation Zod activée sur register et login.
 */
const express = require("express");
const router = express.Router();
const validateRequest = require("../middlewares/ValidateRequest");
const authController = require("../controllers/authController");
const { registerSchema, loginSchema } = require("../validators/authValidator");

router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register,
);
router.post("/login", validateRequest(loginSchema), authController.login);

module.exports = router;
