const express = require('express');
const router = express.Router();
const { auth, db } = require('../Services/Firebase');

router.post('/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        
        // Création dans Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: username
        });

        await db.collection('users').doc(userRecord.uid).set({
            username,
            email,
            createdAt: new Date().toISOString(),
            favorites: []
        });

        res.status(201).json({ message: "Utilisateur créé", uid: userRecord.uid });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;