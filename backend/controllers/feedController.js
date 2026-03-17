// backend/controllers/feedController.js
const admin = require('firebase-admin');

const getDb = () => admin.apps.length ? admin.firestore() : null;

exports.getNewsFeed = async (req, res, next) => {
    try {
        const db = getDb();
        if (!db) throw new Error("Base de données non initialisée");

        const userId = req.user.id;

        // recup la liste des ID des personnes que le user suit
        const followsSnapshot = await db.collection('follows')
            .where('followerId', '==', userId)
            .get();

        const followingIds = [];
        followsSnapshot.forEach(doc => {
            followingIds.push(doc.data().followingId);
        });

        // si l'user ne suit personne --> son fil est vide (sadge)
        if (followingIds.length === 0) {
            return res.json({ success: true, feed: [], msg: "Abonnez-vous à des utilisateurs pour voir leur activité !" });
        }

        //sachant que dans firestore la command in n'accepte qu'un max de 10 valeurs vu que c'est un projet local
        // on prend que les 10 premiers abonnement mais on pourra augmenter avec le temps on verra
        const topFollowingIds = followingIds.slice(0, 10);

        // recup les critiques recentes de ces user
        const reviewsSnapshot = await db.collection('reviews')
            .where('userId', 'in', topFollowingIds)
            .orderBy('updatedAt', 'desc') // On trie du plus récent au plus ancien
            .limit(20) // pour l'instant on limite a 20 post pour pas faire bruler le front
            .get();

        const feed = [];
        reviewsSnapshot.forEach(doc => {
            feed.push({
                id: doc.id, // l'ID de la critique
                type: 'REVIEW_ADDED', // on precise le type d'action pour aider le front-end
                data: doc.data()
            });
        });

        // renvoyer le fil d'actualité au front-end
        res.json({ success: true, feed });

    } catch (error) {
        next(error);
    }
};