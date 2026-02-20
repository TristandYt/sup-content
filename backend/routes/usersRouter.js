/* --------- User router --------- */
const express = require('express');
const router = express.Router();

/* --------- import middleware --------- */
const auth = require('../middlewares/auth');

// Note : Plus tard, vous déplacerez cette logique dans controllers/userController.js
// Mais on prépare la structure avec Firebase Admin pour l'instant
const admin = require('firebase-admin');
const db = admin.firestore();

// GET /api/users/profile - Route protégée par le middleware 'auth'
router.get('/profile', auth, async (req, res) => {
  try {
    // req.user.id vient de notre middleware auth.js !
    const userRef = db.collection('users').doc(req.user.id);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, msg: 'Utilisateur introuvable' });
    }

    const userData = doc.data();
    delete userData.password; // On ne renvoie JAMAIS le mot de passe au front-end

    res.json({ success: true, user: userData });
  } catch (err) {
    console.error("Erreur profile:", err);
    res.status(500).json({ success: false, msg: 'Erreur serveur' });
  }
});

module.exports = router;