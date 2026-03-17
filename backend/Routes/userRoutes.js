const express = require('express');
const router = express.Router();
const { db } = require('../Services/Firebase');

router.post('/:uid/favorites', async (req, res) => {
    try {
        const { gameId, gameName, gameCover } = req.body;
        const userRef = db.collection('users').doc(req.params.uid);
        
        await userRef.update({
            favorites: admin.firestore.FieldValue.arrayUnion({ gameId, gameName, gameCover })
        });

        res.json({ message: "Jeu ajouté aux favoris" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;