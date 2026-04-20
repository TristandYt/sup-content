/*
 * Middleware d'authentification Firebase.
 * Vérifie le token Authorization et attache l'UID à req.user.
 */
const { auth } = require('../Services/Firebase');

const authMiddleware = async (req, res, next) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, msg: 'Accès refusé: Aucun token' });
    }

    try {
        
        const decodedToken = await auth.verifyIdToken(token);
        
        
        req.user = { id: decodedToken.uid };
        
        next();
    } catch (error) {
        res.status(401).json({ success: false, msg: 'Session expirée ou invalide' });
    }
};

module.exports = authMiddleware;