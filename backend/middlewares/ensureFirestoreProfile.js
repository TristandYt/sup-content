/*
 * Middleware ensureFirestoreProfile.
 * Vérifie qu'un document users/{uid} existe dans Firestore après chaque login social OAuth2.
 * Si absent (premier login Google / GitHub / Facebook), le crée automatiquement.
 *
 * À placer après le middleware auth.js dans les routes protégées,
 * ou globalement dans server.js via app.use(auth, ensureFirestoreProfile).
 *
 * Usage dans server.js :
 *   const ensureFirestoreProfile = require('./middlewares/ensureFirestoreProfile');
 *   app.use('/api/users',         authMiddleware, ensureFirestoreProfile, userRoutes);
 *   app.use('/api/lists',         authMiddleware, ensureFirestoreProfile, listRoutes);
 *   // etc.
 */
const { admin, db } = require('../Services/Firebase');

const ensureFirestoreProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (userDoc.exists) return next();
        
        const firebaseUser = await admin.auth().getUser(userId);
        const rawName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user';
        const baseUsername = rawName.replace(/\s+/g, '_').toLowerCase();
        let username = baseUsername;
        const existing = await db.collection('users').where('username', '==', username).get();
        if (!existing.empty) {
            username = `${baseUsername}_${Date.now().toString().slice(-4)}`;
        }

        await userRef.set({
            username,
            email: firebaseUser.email || '',
            bio: '',
            favorites: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = ensureFirestoreProfile;
