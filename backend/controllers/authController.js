/*
 * Contrôleur d'authentification.
 * Gère l'inscription via Firebase Auth et renvoie des tokens / profils.
 */
const { admin, db, auth } = require('../Services/Firebase');

exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Vérification si le pseudo existe déjà (Firestore)
        const userSnap = await db.collection('users').where('username', '==', username).get();
        if (!userSnap.empty) {
            return res.status(401).json({ success: false, msg: 'Ce pseudo est déjà pris.' });
        }

        // 1. Firebase Auth crée l'utilisateur et HACHE le mot de passe automatiquement
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: username,
        });

        // 2. On crée le document dans Firestore avec l'UID de Firebase Auth (SANS le mot de passe)
        await db.collection('users').doc(userRecord.uid).set({
            username: username,
            email: email,
            favorites: [], // Array d'objets vide selon ton schéma
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({ 
            success: true, 
            msg: 'Utilisateur créé avec succès',
            uid: userRecord.uid 
        });

    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    res.json({ 
        success: false, 
        msg: "La connexion avec email/mot de passe doit être gérée côté Front-end avec le SDK Firebase Client (signInWithEmailAndPassword). Le front enverra ensuite le token généré à l'API." 
    });
};

