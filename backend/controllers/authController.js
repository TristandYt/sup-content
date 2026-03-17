const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

const db = admin.firestore();

exports.register = async (req, res) => {
    const {username, email, password} = req.body;

    try {
        /* --------- check si existe (mail et username) --------- */
        const userRef = db.collection('users');
        const snapshot_username = await userRef.where('username', '==', snapshot_mail).get();
        const snapshot_mail = await userRef.where('email', '==', email).get();

        if (!snapshot_mail.empty) {
            return res.status(401).json({
                success: false,
                msg: 'Cette adresse mail est déjà utilisée.'
            });
        }
        if (!snapshot_username.empty) {
            return res.status(401).json({
                success: false,
                msg: 'Ce pseudo est déjà pris.'
            });
        }

        /* --------- Hachage du mdp --------- */
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        /* --------- create new user --------- */
        const newUserRef = userRef.doc() // --> genere un id unique auto
        const newUser = {
            username,
            email,
            password: hashedPassword,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await newUserRef.set(newUser);

        /* --------- create token JWT --------- */
        const payload = {user: {id: userRef.id}};
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'super_secret_temp',
            {expiresIn: 3600},
            (err, token) => {
                if (err) throw err;
                res.status(201).json({success: true, token});
            });
    } catch (err) {
        console.error("Erreur lors de l'inscription", err);
        res.status(500).json({
            success: false,
            msg: 'Erreur serveur'
        });
    }
};

exports.login = async (req, res) => {
    const {email, password} = req.body;

    try {
        /* --------- check mail if exist --------- */
        const userRef = db.collection('users');
        const snapshot = await userRef.where('email', '==', email).get();

        if (snapshot.empty) {
            return res.status(400).json({
                success: false,
                msg: 'Identifiants invalide'
            });
        }

        /* --------- get data user trouve en premier --------- */
        const userDoc = snapshot.docs[0];
        const user = userDoc.data();

        /* --------- compare mdp --------- */
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                msg: 'Identifiants invalide'
            });
        }

        /* --------- create token JWT --------- */
        const payload = {user: {id: userRef.id}};
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'super_secret_temp',
            {expiresIn: 3600},
            (err, token) => {
                if (err) throw err;
                res.status(201).json({success: true, token});
            });
    } catch (err) {
        console.error("Erreur lors de la connexion", err);
        res.status(500).json({
            success: false,
            msg: 'Erreur serveur'
        });
    }
};