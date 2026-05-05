// Middleware de validation de requête (Zod)
const validateRequest = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (err) {
        const errorList = err.errors || err.issues || [];
        const errorMessages = errorList.length > 0 
            ? errorList.map(e => e.message) 
            : [err.message || 'Erreur de validation'];
            
        return res.status(400).json({ success: false, errors: errorMessages });
    }
};

module.exports = validateRequest;