/* --------- Verif les requetes --------- */
const jwt = require("jsonwebtoken");
const router = require("../routes/games");

const auth = (req, res, next) => {
    /* --------- Get header autorisation (le front end enverra "bearer le_token_ici) --------- */
    const authHeader = req.headers('Authorization');
    const token = authHeader.authorization && authHeader.authorization.split(' ')[1]; // --> sépare "bearer" du token

    /* --------- if no token --> block  --------- */
    if (!token) {
        return res.status(401).json({
            success: false,
            msg: 'Accès refusé: Aucun token fourni'
        });
    }

    try {
        /* --------- check et decode token --------- */
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_temp');

        /* --------- attache data user (id firestore) a la query --------- */
        req.user = decoded.user;

        /* --------- q vers controller --------- */
        next();
       } catch (err) {
        res.status(401).json({
            success: false,
            msg: 'Erreur lors de la connexion',
        });
    }
    };

module.exports = auth;