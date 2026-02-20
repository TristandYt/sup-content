/* --------- Verif les requetes --------- */
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            // on teste les donnees du body avec le schema zod
            schema.parse(req.body);
            // si tout est bon, on passe à la suite (le controller)
            next();
        } catch (error) {
            // si ça echoue on renvoie une erreur 400 (Bad Request) avec le detail
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