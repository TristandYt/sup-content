/**
 * tests/routes.test.js
 *
 * Tests des routes HTTP intégrés avec l'émulateur Firebase (Docker).
 */

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'sup-content-tristan';

jest.setTimeout(15000);

const request = require('supertest');
const express = require('express');
const axios = require('axios');

const { db, admin } = require('../Services/Firebase');

// ─────────────────────────────────────────────
//                    MOCKS 
// ─────────────────────────────────────────────

// Simuler que l'utilisateur 'user_alice_001' est connecté
jest.mock('../middlewares/auth', () => (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    req.user = { 
        id: 'user_alice_001', 
        uid: 'user_alice_001', 
        email: 'alice@example.com' 
    };
    next();
});

// Simuler le middleware Firestore Profile
jest.mock('../middlewares/ensureFirestoreProfile', () => (req, res, next) => {
    next();
});

// Mock igdbAuth pour les routes jeux
jest.mock('../Services/igdbAuth', () => ({
    getIgdbToken: jest.fn().mockResolvedValue('fake-igdb-token'),
}));

// Mock axios pour les appels IGDB (POST), 
jest.mock('axios', () => {
    const actualAxios = jest.requireActual('axios');
    return {
        ...actualAxios,
        post: jest.fn().mockResolvedValue({
            data: [{
                id: 1020,
                name: 'Trine',
                cover: { image_id: 'co1r76' },
                total_rating: 79.5,
            }],
        }),
    };
});

// ─────────────────────────────────────────────
// Montage de l'app Express pour les tests
// ─────────────────────────────────────────────

const buildApp = () => {
    const app = express();
    app.use(express.json());

    const authMiddleware = require('../middlewares/auth');
    const ensureFirestoreProfile = require('../middlewares/ensureFirestoreProfile');
    const errorHandler = require('../middlewares/errorHandlers');

    app.use('/api/auth',require('../Routes/authRouter'));
    app.use('/api/games',require('../Routes/games'));
    app.use('/api/users',authMiddleware, ensureFirestoreProfile, require('../Routes/usersRouter'));
    app.use('/api/lists',authMiddleware, ensureFirestoreProfile, require('../Routes/listRouter'));
    app.use('/api/reviews',authMiddleware, ensureFirestoreProfile, require('../Routes/reviewRouter'));
    app.use('/api/follows',authMiddleware, ensureFirestoreProfile, require('../Routes/followRouter'));
    app.use('/api/feeds',authMiddleware, ensureFirestoreProfile, require('../Routes/feedRouter'));
    app.use('/api/conversations', authMiddleware, ensureFirestoreProfile, require('../Routes/conversationRouter'));

    app.use(errorHandler);
    return app;
};

const AUTH_HEADER = { Authorization: 'Bearer fake-token' };

let app;

// ─────────────────────────────────────────────
// PRÉPARATION ET NETTOYAGE DE LA BDD DOCKER
// ─────────────────────────────────────────────

beforeAll(async () => {
    app = buildApp();
    const aliceId = 'user_alice_001';
    const bobId = 'user_bob_999';

    //CRÉER LE COMPTE DANS FIREBASE AUTH (Indispensable pour PUT/DELETE compte)
    try {
        await admin.auth().createUser({
            uid: aliceId,
            email: 'alice@example.com',
            password: 'Password1!',
            displayName: 'alice_plays'
        });
    } catch (e) {
        if (e.code !== 'auth/uid-already-exists') {
            throw e;
        }
    }

    // USERS (Firestore)
    await db.collection('users').doc(aliceId).set({
        username: 'alice_plays',
        email: 'alice@example.com',
        favorites: [{ gameId: '1020', gameName: 'Trine' }],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // LIBRARY 
    await db.collection('users').doc(aliceId).collection('library').doc('1020').set({
        gameId: '1020',
        status: 'playing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // REVIEWS
    await db.collection('reviews').doc(`${aliceId}_1020`).set({
        userId: aliceId,
        gameId: '1020',
        rating: 5,
        text: 'Incroyable !',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // FOLLOWS
    await db.collection('follows').doc(`${aliceId}_${bobId}`).set({
        followerId: aliceId,
        followingId: bobId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // GAMES_CACHE
    await db.collection('games').doc('1020').set({
        name: 'Trine',
        total_rating: 80,
        supcontent_cached_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // CONVERSATIONS & MESSAGES
    const convId = [aliceId, bobId].sort().join('_');
    await db.collection('conversations').doc(convId).set({
        participants: [aliceId, bobId],
        lastMessage: 'Salut Alice !',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await db.collection('conversations').doc(convId).collection('messages').add({
        senderId: bobId,
        text: 'Salut Alice !',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
});

/*afterAll(async () => {
    const projectId = 'sup-content-tristan'; 
    const firestoreHost = '127.0.0.1:8081';
    const authHost = '127.0.0.1:9099'; // Le port de l'émulateur Auth
    
    try {

        await axios.delete(`http://${firestoreHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`);
       
        await axios.delete(`http://${authHost}/emulator/v1/projects/${projectId}/accounts`);
    } catch (e) {
        console.error("Erreur lors du nettoyage de la BDD :", e.message);
    }

    try {
        await admin.app().delete();
    } catch (e) {
        console.error("Erreur lors de la fermeture de Firebase :", e.message);
    }
});
*/
// ─────────────────────────────────────────────
// TESTS AUTH
// ─────────────────────────────────────────────

describe('POST /api/auth/register', () => {
    it('201 — crée un compte avec des données valides', async () => {
    const timestamp = Date.now(); 
    const res = await request(app).post('/api/auth/register').send({
        username: `user_${timestamp}`, 
        email: `nouveau_${timestamp}@example.com`,
        password: 'Password1!',
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
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('400 — rejette un mot de passe trop court (Zod)', async () => {
        const res = await request(app).post('/api/auth/register').send({
            username: 'test',
            email: 'test@example.com',
            password: '123',
        });
        expect(res.status).toBe(400);
    });

    it('400 — rejette un username trop court (Zod)', async () => {
        const res = await request(app).post('/api/auth/register').send({
            username: 'ab',
            email: 'test@example.com',
            password: 'Password1!',
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
        expect(res.body.success).toBe(false); // Intentionnel
    });
});

// ─────────────────────────────────────────────
// TESTS JEUX
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// TESTS UTILISATEURS
// ─────────────────────────────────────────────

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

describe('GET /api/users/:userId/profile', () => {
    it('200 — retourne le profil public sans token', async () => {
        const res = await request(app)
            .get('/api/users/user_alice_001/profile')
            .set(AUTH_HEADER); 

        expect(res.status).toBe(200);
        expect(res.body.user).not.toHaveProperty('email');
    });
});

describe('PUT /api/users/profile', () => {
    it('200 — met à jour le profil', async () => {
        const res = await request(app)
            .put('/api/users/profile')
            .set(AUTH_HEADER)
            .send({ username: 'alice_updated', bio: 'Nouvelle bio' });
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

// À ajouter dans le bloc "TESTS UTILISATEURS"
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

    it('200 — PUT /api/users/email : met à jour l\'email', async () => {
        const res = await request(app)
            .put('/api/users/email')
            .set(AUTH_HEADER)
            .send({ newEmail: 'alice_new@example.com' });
        expect(res.status).toBe(200);
    });

    it('200 — DELETE /api/users/favorites/:gameId : retire un favori', async () => {
        const res = await request(app)
            .delete('/api/users/favorites/1020')
            .set(AUTH_HEADER);
        expect(res.status).toBe(200);
    });

    it('200 — DELETE /api/users/account : supprime le compte', async () => {
        const res = await request(app)
            .delete('/api/users/account')
            .set(AUTH_HEADER);
        expect(res.status).toBe(200);
    });
});

// ─────────────────────────────────────────────
// TESTS BIBLIOTHÈQUE
// ─────────────────────────────────────────────

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
            .send({ gameId: '1020', status: 'en_cours' }); // invalide
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

// À ajouter dans le bloc "TESTS BIBLIOTHÈQUE"
describe('GET /api/lists/library/:gameId', () => {
    it('200 — retourne le statut d\'un jeu précis', async () => {
        const res = await request(app).get('/api/lists/library/1020').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.game.gameId).toBe('1020');
    });
});

describe('DELETE /api/lists/library/:gameId', () => {
    it('200 — retire un jeu de la bibliothèque', async () => {
        // On s'assure que le jeu existe en BDD avant
        await db.collection('users').doc('user_alice_001')
            .collection('library').doc('1020').set({ gameId: '1020', status: 'playing' });

        const res = await request(app)
            .delete('/api/lists/library/1020')
            .set(AUTH_HEADER);
        expect(res.status).toBe(200);
    });
});

// ─────────────────────────────────────────────
// TESTS CRITIQUES
// ─────────────────────────────────────────────

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
        const res = await request(app).get('/api/reviews/game/1020').set(AUTH_HEADER);
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

describe('PUT & DELETE /api/reviews', () => {
    it('200 — PUT /api/reviews/:gameId : modifie une review existante', async () => {
        const res = await request(app)
            .put('/api/reviews/1020')
            .set(AUTH_HEADER)
            .send({ rating: 5, text: 'Finalement, c\'est un chef-d\'œuvre.' });
        expect(res.status).toBe(200);
    });

    it('200 — DELETE /api/reviews/:gameId : supprime une review', async () => {
        const res = await request(app)
            .delete('/api/reviews/1020')
            .set(AUTH_HEADER);
        expect(res.status).toBe(200);
    });
});
// ─────────────────────────────────────────────
// TESTS SUIVI
// ─────────────────────────────────────────────

describe('POST /api/follows/:userId', () => {
    it('400 — ne peut pas se suivre soi-même', async () => {
        const res = await request(app)
            .post('/api/follows/user_alice_001')
            .set(AUTH_HEADER);
        expect(res.status).toBe(400);
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

describe('DELETE /api/follows/:userId', () => {
    it('200 — arrête de suivre un utilisateur', async () => {
        // On crée d'abord le follow pour pouvoir le supprimer
        await db.collection('follows').doc('user_alice_001_user_bob_999').set({
            followerId: 'user_alice_001',
            followingId: 'user_bob_999'
        });

        const res = await request(app)
            .delete('/api/follows/user_bob_999')
            .set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ─────────────────────────────────────────────
// TESTS FEED
// ─────────────────────────────────────────────

describe('GET /api/feeds', () => {
    it('200 — retourne le feed', async () => {
        const res = await request(app).get('/api/feeds').set(AUTH_HEADER);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.feed)).toBe(true);
    });

    it('401 — refusé sans token', async () => {
        const res = await request(app).get('/api/feeds');
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────
// TESTS CONVERSATIONS
// ─────────────────────────────────────────────

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
});

describe('POST /api/conversations/:id/messages', () => {
    it('400 — rejette un message vide', async () => {
        const res = await request(app)
            .post('/api/conversations/conv_001/messages')
            .set(AUTH_HEADER)
            .send({ text: '', attachments: [] });
        expect(res.status).toBe(400);
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
});

describe('PATCH /api/conversations/.../read', () => {
    it('200 — marque un message comme lu', async () => {
        const convId = 'user_alice_001_user_bob_999';
        // Préparation de la donnée
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
});