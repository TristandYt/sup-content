// Crée un profil public Firestore s'il n'existe pas encore
const { admin, db } = require('../../Services/Firebase');

const ensureFirestoreProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            const firebaseUser = await admin.auth().getUser(userId);
            const rawName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user';
            const baseUsername = rawName.replace(/\s+/g, '_').toLowerCase();
            let username = baseUsername;
            const existing = await db.collection('users').where('username', '==', username).get();
            if (!existing.empty) {
                username = `${baseUsername}_${Date.now().toString().slice(-4)}`;
            }

            const newUserData = {
                username,
                email: firebaseUser.email || '',
                bio: '',
                birthDate: null, 
                role: 'user', 
                favorites: [],
                preferences: { theme: 'dark', language: 'fr', emailNotifications: true, pushNotifications: true },
                profileData: { avatarUrl: null, website: '' },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            await userRef.set(newUserData);
            req.user.profile = newUserData;
        } else {
            req.user.profile = userDoc.data();
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = ensureFirestoreProfile;
