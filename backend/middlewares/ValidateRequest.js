/*
 * Middleware de validation de requête.
 * Valide req.body avec un schéma Zod et renvoie les erreurs si nécessaire.
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            const errorMessages = error.errors.map(err => err.message);
            return res.status(400).json({
                success: false,
                msg: "Erreur de validation des données",
                errors: errorMessages
            });
        }
    };
};

module.exports = validateRequest;