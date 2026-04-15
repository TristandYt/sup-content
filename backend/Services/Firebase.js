/*
 * Initialisation Firebase Admin.
 * Active Firestore et Auth en local pour l'API backend.
 */
const admin = require("firebase-admin");

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "database:8081";
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "database:9099";

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || "sup-content-tristan"
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };