// Contrôleur d'authentification
const { admin, db, auth } = require('../Services/Firebase');
const Logger = require('../Services/Logger');

exports.register = async (req, res, next) => {
    try {
        const { username, email, password, birthDate } = req.body;

        const userSnap = await db.collection('users').where('username', '==', username).get();
        if (!userSnap.empty) {
            // 409 Conflict : le pseudo est déjà pris 
            return res.status(409).json({ success: false, msg: 'Ce pseudo est déjà pris.' });
        }

        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: username,
        });

        await db.collection('users').doc(userRecord.uid).set({
            username: username,
            email: email,
            bio: '',
            birthDate: birthDate,
            role: 'user',
            favorites: [],
            preferences: { theme: 'dark', language: 'fr', emailNotifications: true, pushNotifications: true },
            profileData: { avatarUrl: null, website: '' },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await Logger.log('user_registered', userRecord.uid, { username, email });

        res.status(201).json({
            success: true,
            msg: 'Utilisateur créé avec succès',
            uid: userRecord.uid
        });

    } catch (error) {
        next(error);
    }
};

/*
 * POST /api/auth/login
 * Note d'architecture (Firebase) : 
 * La vérification de l'email et du mot de passe se fait directement sur le Frontend via le SDK Firebase.
 * Le Frontend récupère un JWT (Token) qu'il transmettra ensuite au Backend via l'en-tête Authorization.
 * Cette route n'est donc pas censée gérer la validation du mot de passe elle-même en base de données.
 */
exports.login = async (req, res, next) => {
    res.json({
        success: false,
        msg: 'Veuillez utiliser le SDK Firebase côté client pour vous connecter et obtenir votre JWT.'
    });
};

/*
 * POST /api/auth/oauth/callback
 * Appelé par le frontend après une connexion OAuth réussie avec Firebase.
 */
exports.oauthCallback = async (req, res, next) => {
    try {
        const userId = req.user.uid || req.user.id;
        const userDoc = await db.collection('users').doc(userId).get();

        res.status(200).json({
            success: true,
            uid: userId,
            profile: userDoc.data()
        });
    } catch (error) {
        next(error);
    }
};