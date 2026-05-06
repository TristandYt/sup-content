// Tests d'intégration API

require('dotenv').config();

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8081';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = process.env.FIREBASE_PROJECT_ID || 'sup-content-tristan';

jest.setTimeout(15000);

const request = require('supertest');
const express = require('express');
const axios = require('axios');

const { db, admin } = require('../Services/Firebase');
const { calculateAge, getMinAgeFromRating, isAgeAllowed, filterGamesByAge } = require('../utils/pegiHelper');

// --- Mocks ---

jest.mock('../middlewares/auth', () => (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    let userId = 'user_alice_001';
    const token = req.headers.authorization.split(' ')[1];
    
    if (token === 'delete-token') userId = 'user_delete_me';
    else if (token === 'oauth-google') userId = 'oauth_google_123';
    else if (token === 'oauth-github') userId = 'oauth_github_123';
    else if (token === 'oauth-facebook') userId = 'oauth_facebook_123';

    req.user = { 
        id: userId, 
        uid: userId, 
        email: 'fake@example.com' 
    };
    next();
});

jest.mock('../Services/igdbAuth', () => ({
    getIgdbToken: jest.fn().mockResolvedValue('fake-igdb-token'),
}));

jest.mock('axios', () => {
    const actualAxios = jest.requireActual('axios');
    
    // On crée un mock global pour axios() ET axios.post()
    const mockAxios = jest.fn().mockResolvedValue({
        data: [{
            id: 1020,
            name: 'Trine',
            cover: { image_id: 'co1r76' },
            total_rating: 79.5,
            age_ratings: [{ category: 2, rating: 17 }], 
            similar_games: [{ id: 1021, name: 'Trine 2', total_rating: 85, age_ratings: [{ category: 2, rating: 17 }] }] 
        }],
    });

    Object.assign(mockAxios, actualAxios);
    mockAxios.post = mockAxios; 
    return mockAxios;
});

jest.mock('../middlewares/roleMiddleware', () => ({
    isAdmin: (req, res, next) => next()
}));

// --- App Setup ---

const buildApp = () => {
    const app = express();
    app.use(express.json());

    const authMiddleware = require('../middlewares/auth');
    const ensureFirestoreProfile = require('../middlewares/ensureFirestoreProfile');
    const errorHandler = require('../middlewares/errorHandlers');
    const { isAdmin } = require('../middlewares/roleMiddleware');

    app.use('/api/auth',require('../Routes/authRouter'));
    app.use('/api/games',require('../Routes/games'));
    app.use('/api/users',authMiddleware, ensureFirestoreProfile, require('../Routes/usersRouter'));
    app.use('/api/lists',authMiddleware, ensureFirestoreProfile, require('../Routes/listRouter'));
    app.use('/api/reviews', require('../Routes/reviewRouter'));
    app.use('/api/follows',authMiddleware, ensureFirestoreProfile, require('../Routes/followRouter'));
    app.use('/api/feeds',authMiddleware, ensureFirestoreProfile, require('../Routes/feedRouter'));
    app.use('/api/conversations', authMiddleware, ensureFirestoreProfile, require('../Routes/conversationRouter'));

    app.get('/api/users/me/export', authMiddleware, require('../controllers/userController').exportUserData);
    app.post('/api/interactions/reviews/:reviewId/like', authMiddleware, require('../controllers/reviewController').toggleLikeReview);
    app.post('/api/interactions/reviews/:reviewId/comments', authMiddleware, require('../controllers/reviewController').commentReview);
    app.get('/api/notifications', authMiddleware, require('../controllers/notificationController').getMyNotifications);
    app.get('/api/notifications/stream', authMiddleware, require('../controllers/notificationController').streamNotifications);
    app.patch('/api/notifications/:notificationId/read', authMiddleware, require('../controllers/notificationController').markAsRead);
    app.post('/api/moderation/report', authMiddleware, require('../controllers/moderationController').reportContent);
    app.delete('/api/moderation/reviews/:reviewId', authMiddleware, isAdmin, require('../controllers/moderationController').adminDeleteReview);
    app.patch('/api/moderation/reviews/:reviewId/highlight', authMiddleware, isAdmin, require('../controllers/moderationController').adminHighlightReview);

    app.get('/api/search', require('../controllers/searchController').searchAll);
    app.get('/api/recommendations', authMiddleware, require('../controllers/searchController').getRecommendations);
    
    app.post('/api/lists/custom', authMiddleware, require('../controllers/listController').createList);
    app.get('/api/lists/custom/me', authMiddleware, require('../controllers/listController').getMyLists);
    app.get('/api/lists/custom/:listId', authMiddleware, require('../controllers/listController').getListDetails);
    app.post('/api/lists/custom/:listId/games', authMiddleware, require('../controllers/listController').addGameToList);

    app.delete('/api/users/favorites/:gameId', authMiddleware, require('../controllers/userController').removeFavorite);
    app.delete('/api/users/account', authMiddleware, require('../controllers/userController').deleteAccount);
    app.get('/api/users/logs', authMiddleware, isAdmin, require('../controllers/userController').getLogs);
    app.post('/api/users/promote/:userId', authMiddleware, isAdmin, require('../controllers/userController').promoteUser);
    app.post('/api/moderation/users/:userId/ban', authMiddleware, isAdmin, require('../controllers/moderationController').adminBanUser);
    app.get('/api/users/me/stats', authMiddleware, require('../controllers/listController').getMyLibraryStats);

    app.use(errorHandler);
    return app;
};

const AUTH_HEADER = { Authorization: 'Bearer fake-token' };

let app;

// --- Database Init ---

const projectId = 'sup-content-tristan';
const firestoreHost = '127.0.0.1:8081';
const authHost = '127.0.0.1:9099';

beforeAll(async () => {
    app = buildApp();
    const aliceId = 'user_alice_001';
    const bobId = 'user_bob_999';
    const gameId = '1020';

    try {
        await axios.delete(`http://${firestoreHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`);
        await axios.delete(`http://${authHost}/emulator/v1/projects/${projectId}/accounts`);
        console.log("Base de données et comptes Auth nettoyés.");

        await admin.auth().createUser({ uid: 'oauth_google_123', email: 'google@test.com', displayName: 'google_user' });
        await admin.auth().createUser({ uid: 'oauth_github_123', email: 'github@test.com', displayName: 'github_user' });
        await admin.auth().createUser({ uid: 'oauth_facebook_123', email: 'facebook@test.com', displayName: 'facebook_user' });

        await admin.auth().createUser({
            uid: aliceId,
            email: 'alice@example.com',
            password: 'Password1!',
            displayName: 'alice_plays'
        });

        await admin.auth().createUser({
            uid: bobId,
            email: 'bob@example.com',
            password: 'Password1!',
            displayName: 'bob_plays'
        });

        
        await db.collection('users').doc(aliceId).set({
            username: 'alice_plays',
            email: 'alice@example.com',
            birthDate: '1990-01-01', 
            bio: 'Passionnée de jeux indés',
            role: 'user',
            favorites: [{ gameId, gameName: 'Trine', gameCover: 'co1r76' }],
            preferences: { theme: 'dark', language: 'fr', emailNotifications: true, pushNotifications: true },
            profileData: { avatarUrl: null, website: '' },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('users').doc(bobId).set({
            username: 'bob_plays',
            email: 'bob@example.com',
            birthDate: '1995-01-01', 
            bio: 'Hello !',
            role: 'user',
            favorites: [],
            preferences: { theme: 'dark', language: 'fr', emailNotifications: true, pushNotifications: true },
            profileData: { avatarUrl: null, website: '' },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Ajout d'un jeu dans la bibliothèque de Bob pour que le test du Feed d'Alice fonctionne
        await db.collection('users').doc(bobId).collection('library').doc('1021').set({
            gameId: '1021',
            status: 'finished',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('users').doc(aliceId).collection('library').doc(gameId).set({
            gameId: gameId,
            status: 'playing',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('reviews').doc(`${aliceId}_${gameId}`).set({
            userId: aliceId,
            gameId: gameId,
            rating: 5,
            text: 'Une direction artistique sublime !',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('follows').doc(`${aliceId}_${bobId}`).set({
            followerId: aliceId,
            followingId: bobId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('games').doc(gameId).set({
            name: 'Trine',
            total_rating: 79.5,
            cover: { image_id: 'co1r76' },
            supcontent_cached_at: admin.firestore.FieldValue.serverTimestamp()
        });

        const convId = [aliceId, bobId].sort().join('_');
        await db.collection('conversations').doc(convId).set({
            participants: [aliceId, bobId],
            lastMessage: 'Salut Alice !',
            lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
            lastMessageSender: bobId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('conversations').doc(convId).collection('messages').add({
            senderId: bobId,
            text: 'Salut Alice !',
            readBy: [bobId],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log("Toutes les tables du schéma ont été peuplées.");
    } catch (e) {
        console.error("Erreur lors de la préparation :", e.message);
    }
});

// Fermeture des connexions Firebase pour que Jest puisse s'arrêter correctement
afterAll(async () => {
    await Promise.all(admin.apps.map(app => app.delete()));
});

// Tests des connexions via fournisseurs tiers (OAuth) avec création automatique de profil
describe('Connexions OAuth2 (Google, GitHub, Facebook)', () => {
    it('200 — crée automatiquement le profil Firestore pour une connexion Google', async () => {
        const res = await request(app).get('/api/users/profile').set({ Authorization: 'Bearer oauth-google' });
        expect(res.status).toBe(200);
        expect(res.body.user.username).toBe('google_user');
        expect(res.body.user.role).toBe('user'); // Vérifie l'injection des données par défaut
    });

    it('200 — crée automatiquement le profil Firestore pour une connexion GitHub', async () => {
        const res = await request(app).get('/api/users/profile').set({ Authorization: 'Bearer oauth-github' });
        expect(res.status).toBe(200);
        expect(res.body.user.username).toBe('github_user');
    });

    it('200 — crée automatiquement le profil Firestore pour une connexion Facebook', async () => {
        const res = await request(app).get('/api/users/profile').set({ Authorization: 'Bearer oauth-facebook' });
        expect(res.status).toBe(200);
        expect(res.body.user.username).toBe('facebook_user');
    });
});

// Tests de l'authentification classique (Email/Mot de passe)
describe('POST /api/auth/register', () => {
    it('201 — crée un compte avec des données valides', async () => {
    const timestamp = Date.now(); 
    const res = await request(app).post('/api/auth/register').send({
        username: `user_${timestamp}`, 
        email: `nouveau_${timestamp}@example.com`,
        password: 'Password1!',
        birthDate: '1990-01-01'
    });
        
        if (res.status === 500) console.log("ERREUR 500 DÉTECTÉE :", res.body);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('400 — rejette un email invalide (Zod)', async () => {
        const res = await request(app).post('/api/auth/register').send({
            username: 'test',
            email: 'pas-un-email',
            password: 'Password1!',
            birthDate: '1990-01-01'
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('400 — rejette un mot de passe trop court (Zod)', async () => {
        const res = await request(app).post('/api/auth/register').send({
            username: 'test',
            email: 'test@example.com',
            password: '123',
            birthDate: '1990-01-01'
        });
        expect(res.status).toBe(400);
    });

    it('400 — rejette un username trop court (Zod)', async () => {
        const res = await request(app).post('/api/auth/register').send({
            username: 'ab',
            email: 'test@example.com',
            password: 'Password1!',
            birthDate: '1990-01-01'
        });
        expect(res.status).toBe(400);
    });
});

describe('POST /api/auth/login', () => {
    it('200 — retourne le message de redirection vers le SDK client', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: 'alice@example.com',
            password: 'Password1!',
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false); 
    });
});

// Tests du catalogue de jeux et de l'API IGDB
describe('GET /api/games/popular', () => {
    it('200 — retourne une liste de jeux', async () => {
        const res = await request(app).get('/api/games/popular');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('200 — accepte les paramètres sortBy et order', async () => {
        const res = await request(app).get('/api/games/popular?sortBy=total_rating&order=asc');
        expect(res.status).toBe(200);
    });
});

// Tests du filtrage par âge (PEGI / ESRB)
describe('PEGI / Age Helper', () => {
    it('devrait calculer correctement l\'âge', () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-05-15'));
        
        expect(calculateAge('2000-01-01')).toBe(24);
        expect(calculateAge('2010-06-01')).toBe(13); 
        
        jest.useRealTimers();
    });

    it('devrait retourner le bon âge minimum d\'après l\'enum IGDB', () => {
        expect(getMinAgeFromRating(17)).toBe(18); // PEGI 18
        expect(getMinAgeFromRating(15)).toBe(12); // PEGI 12
        expect(getMinAgeFromRating(10)).toBe(13); // ESRB T (Teen)
        expect(getMinAgeFromRating(999)).toBe(0); // Inconnu
    });

    it('devrait bloquer les jeux +18 pour les mineurs', () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));
        const mineur15Ans = '2009-01-01';
        const majeur24Ans = '2000-01-01';

        const gtaV = [{ category: 2, rating: 17 }];

        expect(isAgeAllowed(mineur15Ans, gtaV)).toBe(false);
        expect(isAgeAllowed(majeur24Ans, gtaV)).toBe(true);
        
        jest.useRealTimers();
    });

    it('devrait filtrer un tableau de jeux', () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));
        const mineur10Ans = '2014-01-01';

        const jeux = [
            { id: 1, name: 'Mario', age_ratings: [{ category: 2, rating: 13 }] }, 
            { id: 2, name: 'Zelda', age_ratings: [{ category: 2, rating: 15 }] }, 
            { id: 3, name: 'GTA', age_ratings: [{ category: 2, rating: 17 }] },   
            { id: 4, name: 'Minecraft', age_ratings: null }
        ];

        const resultat = filterGamesByAge(jeux, mineur10Ans);
        expect(resultat.length).toBe(2);
        expect(resultat[0].name).toBe('Mario');
        expect(resultat[1].name).toBe('Minecraft');
        
        jest.useRealTimers();
    });
});

describe('GET /api/games/search', () => {
    it('200 — retourne des résultats pour une recherche valide', async () => {
        const res = await request(app).get('/api/games/search?q=zelda');
        expect(res.status).toBe(200);
    });

    it('400 — rejette une recherche sans paramètre q', async () => {
        const res = await request(app).get('/api/games/search');
        expect(res.status).toBe(400);
    });
});

describe('GET /api/games/details/:id', () => {
    it('200 — retourne les détails d\'un jeu', async () => {
        const res = await request(app).get('/api/games/details/1020');
        expect(res.status).toBe(200);
    });
});

describe('GET /api/games/:id (Alias)', () => {
    it('200 — retourne les détails d\'un jeu via l\'alias', async () => {
        const res = await request(app).get('/api/games/1020');
        expect(res.status).toBe(200);
    });
});

// Tests de la gestion des profils utilisateurs
describe('GET /api/users/profile', () => {
    it('200 — retourne le profil de l\'utilisateur connecté', async () => {
        const res = await request(app).get('/api/users/profile').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('401 — refusé sans token', async () => {
        const res = await request(app).get('/api/users/profile');
        expect(res.status).toBe(401);
    });
});

describe('PUT /api/users/profile', () => {
    it('200 — met à jour le profil', async () => {
        const res = await request(app)
            .put('/api/users/profile')
            .set(AUTH_HEADER)
            .send({ username: 'alice_updated', bio: 'Nouvelle bio', preferences: { theme: 'light', language: 'en', emailNotifications: false, pushNotifications: false } });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe('POST /api/users/favorites', () => {
    it('200 — ajoute un jeu aux favoris', async () => {
        const res = await request(app)
            .post('/api/users/favorites')
            .set(AUTH_HEADER)
            .send({ gameId: '1020', gameName: 'Trine', gameCover: 'co1r76' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('400 — rejette sans gameId', async () => {
        const res = await request(app)
            .post('/api/users/favorites')
            .set(AUTH_HEADER)
            .send({ gameName: 'Trine' });
        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/users/favorites/:gameId', () => {
    it('200 — supprime un jeu des favoris', async () => {
        const res = await request(app).delete('/api/users/favorites/1020').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe('GET /api/users/favorites', () => {
    it('200 — retourne la liste des favoris', async () => {
        const res = await request(app).get('/api/users/favorites').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.favorites)).toBe(true);
    });
});

describe('Mise à jour et Suppression Compte', () => {
    it('200 — PUT /api/users/password : met à jour le mot de passe', async () => {
        const res = await request(app)
            .put('/api/users/password')
            .set(AUTH_HEADER)
            .send({ newPassword: 'NewSecurePassword123!' });
        expect(res.status).toBe(200);
    });

    it('400 — PUT /api/users/password : rejette sans nouveau mot de passe', async () => {
        const res = await request(app).put('/api/users/password').set(AUTH_HEADER).send({});
        expect(res.status).toBe(400);
    });

    it('200 — PUT /api/users/email : met à jour l\'email', async () => {
        const res = await request(app)
            .put('/api/users/email')
            .set(AUTH_HEADER)
            .send({ newEmail: 'alice_new@example.com' });
        expect(res.status).toBe(200);
    });

    it('400 — PUT /api/users/email : rejette sans nouvel email', async () => {
        const res = await request(app).put('/api/users/email').set(AUTH_HEADER).send({});
        expect(res.status).toBe(400);
    });
});

describe('Administration (Users)', () => {
    it('200 — GET /api/users/logs : récupère les logs', async () => {
        const res = await request(app).get('/api/users/logs').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.logs)).toBe(true);
    });

    it('200 — POST /api/users/promote/:userId : promeut un utilisateur', async () => {
        const res = await request(app).post('/api/users/promote/user_bob_999').set(AUTH_HEADER).send({ role: 'admin' });
        expect(res.status).toBe(200);
    });

    it('400 — POST /api/users/promote/:userId : rejette un rôle invalide', async () => {
        const res = await request(app).post('/api/users/promote/user_bob_999').set(AUTH_HEADER).send({ role: 'superadmin' });
        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/users/account', () => {
    it('200 — supprime le compte', async () => {
        await admin.auth().createUser({ uid: 'user_delete_me', email: 'delete@test.com', password: 'Password1!' });
        await db.collection('users').doc('user_delete_me').set({ username: 'delete_me' });
        
        const res = await request(app).delete('/api/users/account').set({ Authorization: 'Bearer delete-token' });
        expect(res.status).toBe(200);

        const doc = await db.collection('users').doc('user_delete_me').get();
        expect(doc.exists).toBe(false);
    });
});

// Tests de la gestion de la bibliothèque de jeux
describe('POST /api/lists/status', () => {
    it('200 — ajoute un jeu avec un statut valide', async () => {
        const res = await request(app)
            .post('/api/lists/status')
            .set(AUTH_HEADER)
            .send({ gameId: '1020', status: 'playing' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('400 — rejette un statut invalide', async () => {
        const res = await request(app)
            .post('/api/lists/status')
            .set(AUTH_HEADER)
            .send({ gameId: '1020', status: 'en_cours' }); 
        expect(res.status).toBe(400);
    });

    it('400 — rejette sans gameId', async () => {
        const res = await request(app)
            .post('/api/lists/status')
            .set(AUTH_HEADER)
            .send({ status: 'playing' });
        expect(res.status).toBe(400);
    });
});


describe('GET /api/lists/library', () => {
    it('200 — retourne la bibliothèque', async () => {
        const res = await request(app).get('/api/lists/library').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('200 — accepte le filtre ?status=playing', async () => {
        const res = await request(app).get('/api/lists/library?status=playing').set(AUTH_HEADER);
        expect(res.status).toBe(200);
    });

    it('400 — rejette un statut de filtre invalide', async () => {
        const res = await request(app).get('/api/lists/library?status=invalid').set(AUTH_HEADER);
        expect(res.status).toBe(400);
    });
});

describe('GET /api/lists/library/:gameId', () => {
    it('200 — retourne le statut d\'un jeu précis', async () => {
        const res = await request(app).get('/api/lists/library/1020').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.game.gameId).toBe('1020');
    });

    it('404 — rejette si le jeu n\'est pas dans la bibliothèque', async () => {
        const res = await request(app).get('/api/lists/library/99999').set(AUTH_HEADER);
        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/lists/library/:gameId', () => {
    it('200 — supprime un jeu de la bibliothèque', async () => {
        // On crée un jeu jetable pour ne pas affecter les autres tests
        await request(app).post('/api/lists/status').set(AUTH_HEADER).send({ gameId: '9999', status: 'dropped' });

        const res = await request(app)
            .delete('/api/lists/library/9999')
            .set(AUTH_HEADER);
        expect(res.status).toBe(200);
    });

    it('404 — rejette si jeu inexistant dans la bibliothèque', async () => {
        const res = await request(app)
            .delete('/api/lists/library/8888')
            .set(AUTH_HEADER);
        expect(res.status).toBe(404);
    });
});

describe('Tableau de bord (Stats)', () => {
    it('200 — retourne les statistiques de la bibliothèque', async () => {
        const res = await request(app).get('/api/users/me/stats').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.stats).toHaveProperty('playing');
        expect(res.body.stats.playing).toBeGreaterThan(0); 
    });
});

// Tests du système de critiques (Reviews)
describe('POST /api/reviews', () => {
    it('200 — crée une review valide', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .set(AUTH_HEADER)
            .send({ gameId: '1020', rating: 4, text: 'Super jeu !' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('400 — rejette une note hors de 1-5', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .set(AUTH_HEADER)
            .send({ gameId: '1020', rating: 6 });
        expect(res.status).toBe(400);
    });

    it('400 — rejette sans rating', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .set(AUTH_HEADER)
            .send({ gameId: '1020' });
        expect(res.status).toBe(400);
    });

    it('400 — rejette sans gameId', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .set(AUTH_HEADER)
            .send({ rating: 4 });
        expect(res.status).toBe(400);
    });

    
});

describe('GET /api/reviews/game/:gameId', () => {
    it('200 — retourne les reviews d\'un jeu sans token', async () => {
        const res = await request(app).get('/api/reviews/game/1020'); 
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('averageRating');
    });
});

describe('GET /api/reviews/me', () => {
    it('200 — retourne les reviews de l\'utilisateur connecté', async () => {
        const res = await request(app).get('/api/reviews/me').set(AUTH_HEADER);
        expect(res.status).toBe(200);
    });

    it('401 — refusé sans token', async () => {
        const res = await request(app).get('/api/reviews/me');
        expect(res.status).toBe(401);
    });
});

describe('PUT/api/reviews', () => {
    it('200 — PUT /api/reviews/:gameId : modifie une review existante', async () => {
        const res = await request(app)
            .put('/api/reviews/1020')
            .set(AUTH_HEADER)
            .send({ rating: 5, text: 'Finalement, c\'est un chef-d\'œuvre.' });
        expect(res.status).toBe(200);
    });
});

describe('DELETE /api/reviews/:gameId', () => {
    it('200 — supprime une review existante', async () => {
        // On crée une critique jetable pour préserver celle du jeu 1020
        await request(app).post('/api/reviews').set(AUTH_HEADER).send({ gameId: '8888', rating: 3, text: 'bof' });

        const res = await request(app)
            .delete('/api/reviews/8888')
            .set(AUTH_HEADER);
        expect(res.status).toBe(200);
    });

    it('404 — rejette si review inexistante', async () => {
        const res = await request(app)
            .delete('/api/reviews/9999')
            .set(AUTH_HEADER);
        expect(res.status).toBe(404);
    });
});

// Test de conformité RGPD (Export de données)
describe('GET /api/users/me/export', () => {
    it('200 — exporte les données RGPD au format JSON', async () => {
        const res = await request(app).get('/api/users/me/export').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/application\/json/);
        expect(res.body).toHaveProperty('profile');
        expect(res.body).toHaveProperty('library');
        // On s'attend au nouveau pseudo car le test PUT /api/users/profile l'a modifié
        expect(res.body.profile.username).toBe('alice_updated');
    });
});

// Tests des interactions sociales (Likes et Commentaires)
describe('Interactions Sociales', () => {
    it('200 — permet de liker une critique', async () => {
        const res = await request(app)
            .post('/api/interactions/reviews/user_alice_001_1020/like')
            .set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('201 — permet de commenter une critique', async () => {
        const res = await request(app)
            .post('/api/interactions/reviews/user_alice_001_1020/comments')
            .set(AUTH_HEADER)
            .send({ text: 'Je suis totalement d\'accord !' });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('400 — commentaire : rejette un commentaire vide', async () => {
        const res = await request(app).post('/api/interactions/reviews/user_alice_001_1020/comments').set(AUTH_HEADER).send({ text: '   ' });
        expect(res.status).toBe(400);
    });

    it('404 — like : rejette si la critique n\'existe pas', async () => {
        const res = await request(app).post('/api/interactions/reviews/ghost_review/like').set(AUTH_HEADER);
        expect(res.status).toBe(404);
    });
});

// Tests du système d'abonnements (Follow/Unfollow)
describe('POST /api/follows/:userId', () => {
    it('400 — ne peut pas se suivre soi-même', async () => {
        const res = await request(app)
            .post('/api/follows/user_alice_001')
            .set(AUTH_HEADER);
        expect(res.status).toBe(400);
    });

    it('409 — rejette si on suit déjà l\'utilisateur', async () => {
        const res = await request(app).post('/api/follows/user_bob_999').set(AUTH_HEADER);
        expect(res.status).toBe(409); // Alice suit déjà Bob
    });

    it('201 — permet de suivre un nouvel utilisateur', async () => {
        await db.collection('users').doc('user_charlie_003').set({ username: 'charlie' });
        const res = await request(app).post('/api/follows/user_charlie_003').set(AUTH_HEADER);
        expect(res.status).toBe(201);
    });
});

describe('DELETE /api/follows/:userId', () => {
    it('200 — permet de se désabonner', async () => {
        const res = await request(app).delete('/api/follows/user_charlie_003').set(AUTH_HEADER);
        expect(res.status).toBe(200);
    });

    it('404 — rejette si on ne suit pas l\'utilisateur', async () => {
        const res = await request(app).delete('/api/follows/ghost_user').set(AUTH_HEADER);
        expect(res.status).toBe(404);
    });
});

describe('GET /api/follows/me/following', () => {
    it('200 — retourne la liste des followings', async () => {
        const res = await request(app).get('/api/follows/me/following').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe('GET /api/follows/me/followers', () => {
    it('200 — retourne la liste des followers', async () => {
        const res = await request(app).get('/api/follows/me/followers').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// Tests du fil d'actualité
describe('GET /api/feeds', () => {
    it('200 — retourne le feed', async () => {
        const res = await request(app).get('/api/feeds').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.feed)).toBe(true);
        // Le feed doit désormais contenir des reviews ET des ajouts en bibliothèque
        const hasLibraryUpdate = res.body.feed.some(item => item.type === 'LIBRARY_UPDATED');
        expect(hasLibraryUpdate).toBe(true);
    });

    it('401 — refusé sans token', async () => {
        const res = await request(app).get('/api/feeds');
        expect(res.status).toBe(401);
    });
});

// Tests du moteur de recherche unifié
describe('Recherche unifiée (2.2.8)', () => {
    it('200 — recherche utilisateurs et jeux', async () => {
        const res = await request(app).get('/api/search?q=alice');
        expect(res.status).toBe(200);
        expect(res.body.results).toHaveProperty('users');
        expect(res.body.results).toHaveProperty('games');
        expect(res.body.results).toHaveProperty('lists');
    });
});

// Tests du centre de notifications
describe('Notifications', () => {
    it('200 — récupère la liste des notifications', async () => {
        const res = await request(app).get('/api/notifications').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.notifications)).toBe(true);
        
        // Vérifier que la notification de Recommandation a bien été générée lors de l'ajout aux favoris
        const hasReco = res.body.notifications.some(n => n.type === 'RECOMMENDATION');
        expect(hasReco).toBe(true);
    });

    it('200 — marque une notification comme lue', async () => {
        const notifRef = await db.collection('notifications').add({ userId: 'user_alice_001', isRead: false });
        const res = await request(app).patch(`/api/notifications/${notifRef.id}/read`).set(AUTH_HEADER);
        expect(res.status).toBe(200);
    });

    it('404 — marquer lue : rejette si inexistante', async () => {
        const res = await request(app).patch('/api/notifications/ghost_notif/read').set(AUTH_HEADER);
        expect(res.status).toBe(404);
    });

    it('403 — marquer lue : rejette si n\'appartient pas à l\'utilisateur', async () => {
        const notifRef = await db.collection('notifications').add({ userId: 'user_bob_999', isRead: false });
        const res = await request(app).patch(`/api/notifications/${notifRef.id}/read`).set(AUTH_HEADER);
        expect(res.status).toBe(403);
    });
});

// Tests des outils de modération (Signalements et Administration)
describe('Modération', () => {
    it('201 — permet à un utilisateur de signaler un contenu', async () => {
        const res = await request(app)
            .post('/api/moderation/report')
            .set(AUTH_HEADER)
            .send({ targetId: 'user_bob_999', targetType: 'user', reason: 'Comportement toxique' });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    // On met en avant AVANT de la supprimer (ordre logique)
    it('200 — admin peut mettre en avant une critique', async () => {
        const res = await request(app).patch('/api/moderation/reviews/user_alice_001_1020/highlight').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.isHighlighted).toBe(true);
    });

    it('200 — permet à un admin de supprimer une critique (supposé protégé par middleware)', async () => {
        const res = await request(app).delete('/api/moderation/reviews/user_alice_001_1020').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('200 — admin peut bannir un utilisateur', async () => {
        const res = await request(app)
            .post('/api/moderation/users/user_bob_999/ban')
            .set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// Tests de la création et gestion de listes de jeux personnalisées
describe('Listes personnalisées (2.2.2)', () => {
    it('201 — crée une liste personnalisée', async () => {
        const res = await request(app)
            .post('/api/lists/custom')
            .set(AUTH_HEADER)
            .send({ name: 'Jeux Horreur', isPrivate: true });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('200 — retourne les listes personnalisées de l\'utilisateur', async () => {
        const res = await request(app).get('/api/lists/custom/me').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.lists)).toBe(true);
    });

    it('200 — ajoute un jeu à une liste', async () => {
        const createRes = await request(app).post('/api/lists/custom').set(AUTH_HEADER).send({ name: 'My List' });
        const listId = createRes.body.listId;
        
        const res = await request(app).post(`/api/lists/custom/${listId}/games`).set(AUTH_HEADER).send({ gameId: '1020', gameName: 'Trine' });
        expect(res.status).toBe(200);
        
        const detailsRes = await request(app).get(`/api/lists/custom/${listId}`).set(AUTH_HEADER);
        expect(detailsRes.status).toBe(200);
        expect(detailsRes.body.list.games.length).toBeGreaterThan(0);
    });

    it('404 — ajoute un jeu : rejette si liste inexistante', async () => {
        const res = await request(app).post('/api/lists/custom/ghost_list/games').set(AUTH_HEADER).send({ gameId: '1020' });
        expect(res.status).toBe(404);
    });

    it('403 — détails : rejette si la liste est privée et ne nous appartient pas', async () => {
        const docRef = await db.collection('custom_lists').add({ userId: 'user_bob_999', name: 'Private Bob', isPrivate: true, games: [] });
        const res = await request(app).get(`/api/lists/custom/${docRef.id}`).set(AUTH_HEADER);
        expect(res.status).toBe(403);
    });
});

// Tests du système de recommandations intelligent
describe('Recommandations (2.2.6)', () => {
    it('200 — récupère des recommandations pour l\'utilisateur', async () => {
        const res = await request(app).get('/api/recommendations').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.recommendations)).toBe(true);
        expect(res.body.recommendations.length).toBeGreaterThan(0);
    });

    it('200 — filtre les recommandations PEGI 18 pour un utilisateur mineur', async () => {
        // 1. On modifie l'âge d'Alice pour la rendre mineure (née en 2015)
        await db.collection('users').doc('user_alice_001').update({ birthDate: '2015-01-01' });
        
        const res = await request(app).get('/api/recommendations').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.recommendations.length).toBe(0); // Le jeu mocké +18 lui est masqué !
        
        // 2. Restauration de l'âge d'Alice pour les tests suivants
        await db.collection('users').doc('user_alice_001').update({ birthDate: '1990-01-01' });
    });
});

// Tests de la messagerie instantanée privée
describe('POST /api/conversations', () => {
    it('400 — rejette sans targetUserId', async () => {
        const res = await request(app)
            .post('/api/conversations')
            .set(AUTH_HEADER)
            .send({});
        expect(res.status).toBe(400);
    });

    it('400 — ne peut pas s\'écrire à soi-même', async () => {
        const res = await request(app)
            .post('/api/conversations')
            .set(AUTH_HEADER)
            .send({ targetUserId: 'user_alice_001' }); 
        expect(res.status).toBe(400);
    });

    it('404 — rejette si l\'utilisateur cible n\'existe pas', async () => {
        const res = await request(app)
            .post('/api/conversations')
            .set(AUTH_HEADER)
            .send({ targetUserId: 'ghost_user' });
        expect(res.status).toBe(404);
    });

    it('403 — rejette si le suivi mutuel n\'est pas établi', async () => {
        await db.collection('users').doc('user_charlie_003').set({ username: 'charlie' });
        const res = await request(app)
            .post('/api/conversations')
            .set(AUTH_HEADER)
            .send({ targetUserId: 'user_charlie_003' });
        expect(res.status).toBe(403);
    });
});

describe('POST /api/conversations/:id/messages', () => {
    it('400 — rejette un message vide', async () => {
        const res = await request(app)
            .post('/api/conversations/conv_001/messages')
            .set(AUTH_HEADER)
            .send({ text: '', attachments: [] });
        expect(res.status).toBe(400);
    });

    it('201 — envoie un message avec succès', async () => {
        const convId = 'user_alice_001_user_bob_999';
        // Le suivi mutuel a été établi lors du test FOLLOW précédent
        await db.collection('follows').doc('user_bob_999_user_alice_001').set({ followerId: 'user_bob_999', followingId: 'user_alice_001' });
        const res = await request(app).post(`/api/conversations/${convId}/messages`).set(AUTH_HEADER).send({ text: 'Nouveau message' });
        expect(res.status).toBe(201);
    });

    it('404 — rejette si la conversation n\'existe pas pour un message', async () => {
        const res = await request(app).post('/api/conversations/ghost_conv/messages').set(AUTH_HEADER).send({ text: 'Hello' });
        expect(res.status).toBe(404);
    });
});

describe('GET /api/conversations', () => {
    it('200 — retourne la liste des conversations', async () => {
        const res = await request(app).get('/api/conversations').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('401 — refusé sans token', async () => {
        const res = await request(app).get('/api/conversations');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/conversations/:id/messages', () => {
    it('200 — retourne l\'historique des messages', async () => {
        const convId = 'user_alice_001_user_bob_999';
        const res = await request(app)
            .get(`/api/conversations/${convId}/messages`)
            .set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.messages)).toBe(true);
    });

    it('403 — refuse l\'accès aux messages si l\'utilisateur n\'est pas participant', async () => {
        await db.collection('conversations').doc('user_bob_999_user_charlie_003').set({ participants: ['user_bob_999', 'user_charlie_003'] });
        const res = await request(app)
            .get('/api/conversations/user_bob_999_user_charlie_003/messages')
            .set(AUTH_HEADER);
        expect(res.status).toBe(403);
    });
});

describe('PATCH /api/conversations/.../read', () => {
    it('200 — marque un message comme lu', async () => {
        const convId = 'user_alice_001_user_bob_999';
        await db.collection('conversations').doc(convId).set({ participants: ['user_alice_001', 'user_bob_999'] });
        const msgRef = await db.collection('conversations').doc(convId).collection('messages').add({
            text: 'Hello',
            senderId: 'user_bob_999',
            readBy: []
        });

        const res = await request(app)
            .patch(`/api/conversations/${convId}/messages/${msgRef.id}/read`)
            .set(AUTH_HEADER);
        expect(res.status).toBe(200);
    });

    it('404 — rejette si la conversation n\'existe pas (lecture)', async () => {
        const res = await request(app).patch('/api/conversations/ghost_conv/messages/msg123/read').set(AUTH_HEADER);
        expect(res.status).toBe(404);
    });

    it('404 — rejette si le message n\'existe pas (lecture)', async () => {
        const convId = 'user_alice_001_user_bob_999';
        const res = await request(app).patch(`/api/conversations/${convId}/messages/ghost_msg/read`).set(AUTH_HEADER);
        expect(res.status).toBe(404);
    });
});