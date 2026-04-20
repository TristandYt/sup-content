// const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

const getDb = admin.apps.length ? admin.firestore() : null;

// exports.register = async (req, res) => {
//     const {username, email, password} = req.body;
//
//     try {
//         /* --------- check si existe (mail et username) --------- */
//         const userRef = db.collection('users');
//         const snapshot_username = await userRef.where('username', '==', snapshot_mail).get();
//         const snapshot_mail = await userRef.where('email', '==', email).get();
//
//         if (!snapshot_mail.empty) {
//             return res.status(401).json({
//                 success: false,
//                 msg: 'Cette adresse mail est déjà utilisée.'
//             });
//         }
//         if (!snapshot_username.empty) {
//             return res.status(401).json({
//                 success: false,
//                 msg: 'Ce pseudo est déjà pris.'
//             });
//         }
//
//         /* --------- Hachage du mdp --------- */
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);
//
//         /* --------- create new user --------- */
//         const newUserRef = userRef.doc() // --> genere un id unique auto
//         const newUser = {
//             username,
//             email,
//             password: hashedPassword,
//             createdAt: admin.firestore.FieldValue.serverTimestamp(),
//         };
//
//         await newUserRef.set(newUser);
//
//         /* --------- create token JWT --------- */
//         const payload = {user: {id: userRef.id}};
//         jwt.sign(
//             payload,
//             process.env.JWT_SECRET || 'super_secret_temp',
//             {expiresIn: 3600},
//             (err, token) => {
//                 if (err) throw err;
//                 res.status(201).json({success: true, token});
//             });
//     } catch (err) {
//         console.error("Erreur lors de l'inscription", err);
//         res.status(500).json({
//             success: false,
//             msg: 'Erreur serveur'
//         });
//     }
// };

exports.register = async (req, res, next) => {
    const { username, firebaseToken } = req.body;

    try {
        const db = getDb();
        if (!db) throw new Error("Base de données non initialisée");

        // check le token renvoyé par l'inscription firebase
        const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
        const { email, uid } = decodedToken;

        const usersRef = db.collection('users');
        const userDoc = await usersRef.doc(uid).get();

        // chek si il n'est pas dans firestore
        if (userDoc.exists) {
            return res.status(400).json({ success: false, msg: 'Utilisateur déjà inscrit' });
        }

        // on crée son profil public dans firestore avce l'id secur firebase
        await usersRef.doc(uid).set({
            username,
            email,
            authProvider: 'email',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // renvoie le jwt pour la session de l'appli
        const payload = { user: { id: uid } };
        jwt.sign(payload, process.env.JWT_SECRET || 'super_secret_temporaire', { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ success: true, token });
        });

    } catch (error) {
        console.error("Erreur Inscription Firebase :", error);
        res.status(400).json({ success: false, msg: "Erreur lors de l'inscription (Token invalide)" });
    }
};

// exports.login = async (req, res) => {
//     const {email, password} = req.body;
//
//     try {
//         /* --------- check mail if exist --------- */
//         const userRef = db.collection('users');
//         const snapshot = await userRef.where('email', '==', email).get();
//
//         if (snapshot.empty) {
//             return res.status(400).json({
//                 success: false,
//                 msg: 'Identifiants invalide'
//             });
//         }
//
//         /* --------- get data user trouve en premier --------- */
//         const userDoc = snapshot.docs[0];
//         const user = userDoc.data();
//
//         /* --------- compare mdp --------- */
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(401).json({
//                 success: false,
//                 msg: 'Identifiants invalide'
//             });
//         }
//
//         /* --------- create token JWT --------- */
//         const payload = {user: {id: userRef.id}};
//         jwt.sign(
//             payload,
//             process.env.JWT_SECRET || 'super_secret_temp',
//             {expiresIn: 3600},
//             (err, token) => {
//                 if (err) throw err;
//                 res.status(201).json({success: true, token});
//             });
//     } catch (err) {
//         console.error("Erreur lors de la connexion", err);
//         res.status(500).json({
//             success: false,
//             msg: 'Erreur serveur'
//         });
//     }
// };

exports.login = async (req, res, next) => {
    const { firebaseToken } = req.body;

    try {
        const db = getDb();
        if (!db) throw new Error("Base de données non initialisée");

        // check le token de connexion
        const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
        const { uid } = decodedToken;

        // check si profile existe
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, msg: 'Profil introuvable dans la base de données' });
        }

        // renvoie le jwt
        const payload = { user: { id: uid } };
        jwt.sign(payload, process.env.JWT_SECRET || 'super_secret_temporaire', { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ success: true, token });
        });

    } catch (error) {
        console.error("Erreur Connexion Firebase :", error);
        res.status(401).json({ success: false, msg: "Identifiants invalides ou token expiré" });
    }
};

exports.socialLogin = async (req, res) => {
    const { firebaseToken } = req.body;

    try {
        // check via firebase la veracité du token
        const decodedToken = await admin.auth.verifyIdToken(firebaseToken);

        // info publique via google
        const { email, name, uid, picture } = decodedToken;

        const userRef = db.collection('users');

        // check si email eiste deja dans bdd
        const snapshot = await userRef.where('email', '==', email).get();

        let userId;

        if (snapshot.empty) {
            // premier cas : nouveau user --> crée compte auto
            const newUser = {
                username: name || email.split('@')[0], // si pas de nom public on prend le debut de son addr mail
                email: email,
                avatar: picture,
                authProvider: 'social', // pour savoir si il se co pas avec un mdp
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // on utilise l'uid de firebase comme id de doc car il est plus sécur
            await userRef.doc(uid).set(newUser);
            userId = uid;
        } else {
            // deuxieme cas : user deja existant --> on recuo juste son id
            userId = snapshot.docs[0].id;
        }

        // genere token JWT
        const payload = {user: {id: userId}};
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'super_secret_temp',
            {expiresIn: 3600},
            (err, token) => {
                if (err) throw err;
                res.json({success: true, token});
            });
    }   catch (error) {
        console.error("Erreur lors de la connexion sociale :", error);
        res.status(401).json({ sucess: false, msg: "Token d'authentification invalide ou expiré" });
    }
};