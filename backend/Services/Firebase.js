const admin = require("firebase-admin");

process.env.FIRESTORE_EMULATOR_HOST = "database:8081";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "database:9099";

admin.initializeApp({
  projectId: "sup-content-tristan"
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };