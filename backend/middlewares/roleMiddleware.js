/*
 * Middleware pour vérifier les rôles des utilisateurs.
 * Utilise req.user.profile.role pour vérifier le rôle.
 */

const checkRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user || !req.user.profile) {
            return res.status(401).json({ success: false, msg: 'Utilisateur non authentifié' });
        }

        if (req.user.profile.role !== requiredRole) {
            return res.status(403).json({ success: false, msg: 'Accès refusé' });
        }

        next();
    };
};

const isAdmin = checkRole('admin');
const isUser = checkRole('user');

module.exports = {
    checkRole,
    isAdmin,
    isUser
};