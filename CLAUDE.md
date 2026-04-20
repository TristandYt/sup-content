# CLAUDE.md — GameList Backend

## Project Overview

**GameList** est une application sociale autour des jeux vidéo — l'équivalent d'AnimeList/MyAnimeList mais pour les jeux. Les utilisateurs peuvent :
- Consulter des fiches de jeux (via IGDB)
- Noter et rédiger des critiques
- Gérer leur bibliothèque personnelle (backlog, en cours, terminé, abandonné)
- Suivre d'autres utilisateurs et voir leur activité dans un feed
- Envoyer des messages privés aux utilisateurs qui les suivent en retour (suivi mutuel requis)

- **Stack :** Node.js + Express + Firebase Admin SDK + Docker
- **API externe :** IGDB (via Twitch OAuth2) avec cache Firestore
- **Auth :** Firebase Auth — la connexion est gérée côté client avec le Firebase Client SDK (`signInWithEmailAndPassword`). Le backend ne fait que vérifier les ID tokens via `Authorization: Bearer <token>`.

---

## Architecture des fichiers

```
/
├── server.js                   # Point d'entrée, middleware, enregistrement des routes
├── Routes/
│   ├── authRouter.js           # POST /api/auth/register|login
│   ├── games.js                # GET /api/games/popular|search|details/:id|:id
│   ├── usersRouter.js          # /api/users/profile, /favorites, /password, /email, /account, /logs (admin), /promote (admin)
│   ├── listRouter.js           # /api/lists/status, /api/lists/library
│   ├── reviewRouter.js         # /api/reviews/...
│   ├── followRouter.js         # /api/follows/:userId, /api/follows/me/following
│   ├── feedRouter.js           # GET /api/feeds/
│   └── conversationRouter.js   # /api/conversations/...
├── controllers/                # Logique métier (un fichier par domaine)
├── Services/
│   ├── Firebase.js             # Init Firebase Admin (Firestore + Auth)
│   ├── igdbAuth.js             # Gestion du token Twitch OAuth2 (cache mémoire avec expiry)
│   ├── Api_igdb.js             # Classe de service IGDB (non utilisée directement par les routes)
│   └── Logger.js               # Service de logging pour les actions utilisateurs
├── middlewares/
│   ├── auth.js                 # Vérification du token Firebase → req.user.id
│   ├── ensureFirestoreProfile.js # Assure l'existence du profil Firestore + attache req.user.profile
│   ├── roleMiddleware.js       # Vérification des rôles (admin/user)
│   ├── ValidateRequest.js      # Middleware de validation Zod
│   └── errorHandlers.js        # Gestionnaire d'erreurs global (signature 4 args)
└── validators/
    └── authValidator.js        # Schémas Zod : registerSchema, loginSchema
```

---

## Modèle de données Firestore

### `users/{userId}`
Document créé à l'inscription via Firebase Auth.
```
{
  username:   string,          // pseudo unique, vérifié à l'inscription
  email:      string,
  bio:        string,          // optionnel, renseigné via PUT /api/users/profile
  role:       "user" | "admin", // rôle de l'utilisateur (défaut: "user")
  favorites:  Array<{          // jeux mis en favoris
    gameId:   string,
    gameName: string,
    gameCover: string
  }>,
  createdAt:  Timestamp,
  updatedAt:  Timestamp        // mis à jour via PUT /api/users/profile
}
```

### `users/{userId}/library/{gameId}` *(sous-collection)*
Un document par jeu ajouté à la bibliothèque de l'utilisateur.
```
{
  gameId:    string,
  status:    "to_play" | "playing" | "finished" | "dropped",
  updatedAt: Timestamp
}
```
> ⚠️ `gameId` est **toujours stocké en string** (`.toString()`), même si IGDB renvoie un number.

### `reviews/{userId}_{gameId}`
Une review par utilisateur par jeu (ID composite).
```
{
  userId:    string,
  gameId:    string,           // string, pas number
  rating:    number,           // entier entre 1 et 5
  text:      string,           // peut être vide ""
  updatedAt: Timestamp
}
```

### `follows/{followerId}_{followingId}`
Une relation de suivi (ID composite).
```
{
  followerId:  string,
  followingId: string,
  createdAt:   Timestamp
}
```
> Un utilisateur ne peut pas se suivre lui-même (vérifié en controller).

### `games/{gameId}` *(cache IGDB)*
Données IGDB mises en cache pour éviter les appels répétés.
```
{
  // Tous les champs IGDB (name, cover, genres, platforms, summary, etc.)
  supcontent_cached_at: Timestamp   // date de mise en cache
}
```

### `logs/{logId}` *(collection de logs)*
Logs des actions utilisateurs pour consultation par les admins.
```
{
  action:     string,           // type d'action (ex: 'user_registered', 'profile_updated', etc.)
  userId:     string,           // ID de l'utilisateur qui a effectué l'action
  details:    object,           // détails supplémentaires selon l'action
  timestamp:  Timestamp         // date et heure de l'action
}
```

### `conversations/{conversationId}`
Une conversation 1-to-1 entre deux utilisateurs qui se suivent **mutuellement**.
L'ID du document est un ID composite trié alphabétiquement : `{userIdA}_{userIdB}` (userIdA < userIdB), ce qui garantit l'unicité de la conversation entre deux utilisateurs.

```
{
  participants:      Array<string>,   // [userIdA, userIdB] — toujours 2 entrées
  lastMessage:       string,          // contenu du dernier message (pour aperçu)
  lastMessageAt:     Timestamp,       // date du dernier message (pour tri du feed conversations)
  lastMessageSender: string,          // userId de l'expéditeur du dernier message
  createdAt:         Timestamp
}
```

> **Règle d'accès :** Vérifier avant création que `follows/{userA}_{userB}` ET `follows/{userB}_{userA}` existent tous les deux (suivi mutuel).

### `conversations/{conversationId}/messages/{messageId}` *(sous-collection)*
Un document par message, ordonné par `createdAt`.
```
{
  senderId:    string,           // userId de l'expéditeur
  text:        string,           // contenu texte (peut être vide si le message est un fichier seul)
  attachments: Array<{           // optionnel — pièces jointes (images ou fichiers)
    type:      "image" | "file",
    url:       string,           // URL Firebase Storage
    name:      string,           // nom du fichier original
    mimeType:  string,           // ex: "image/jpeg", "application/pdf"
    sizeBytes: number
  }>,
  readBy:      Array<string>,    // userIds ayant lu ce message — ex: ["userIdA"]
  createdAt:   Timestamp
}
```

> **Read receipt :** Un message est considéré "vu" quand le `userId` du destinataire est dans `readBy`. Ajouter via `arrayUnion` lors de la lecture.
> **Pièces jointes :** Les fichiers sont uploadés dans Firebase Storage avant l'envoi du message. Le message stocke uniquement les URLs et métadonnées — jamais le contenu binaire directement dans Firestore.
> **ID du message :** Utiliser `db.collection(...).doc()` (auto-ID Firestore) — pas d'ID composite.
> **Validation :** `text` OU au moins une entrée dans `attachments` doit être présent — un message ne peut pas être vide.

---

## Comportements importants

### Authentification
- Toutes les routes sous `usersRouter`, `listRouter`, `followRouter`, `feedRouter`, `conversationRouter`, `reviewRouter` sont **protégées** par le middleware `auth`.
- Seules les routes `/api/games/*` et `/api/auth/*` sont **publiques** (pas de token requis).
- L'endpoint `POST /api/auth/login` retourne intentionnellement un message renvoyant au SDK client — **ne pas implémenter de login serveur**.

### Rôles utilisateur
- Deux rôles : `user` (défaut) et `admin`
- Les admins peuvent consulter les logs via `GET /api/users/logs`
- Les admins peuvent promouvoir des utilisateurs via `POST /api/users/promote/:userId`
- Le middleware `roleMiddleware.js` fournit `isAdmin` pour protéger les routes admin

### Conversations — règles métier
- Une conversation ne peut être créée que si les deux utilisateurs se suivent **mutuellement** (vérifier les deux documents `follows`).
- L'ID de conversation se construit en triant les deux userIds alphabétiquement : `[idA, idB].sort().join('_')`. Cela évite les doublons (`A_B` vs `B_A`).
- Lors de l'envoi d'un message, mettre à jour en même temps le document parent `conversations/{id}` avec `lastMessage`, `lastMessageAt`, `lastMessageSender` (batch write ou transaction).
- Un message doit contenir soit du `text` non vide, soit au moins une pièce jointe — rejeter les messages vides avec un 400.
- Les fichiers sont uploadés dans Firebase Storage **avant** l'appel API d'envoi de message. Le controller reçoit uniquement les URLs et métadonnées, jamais le binaire.

### Cache IGDB
- Les détails d'un jeu sont d'abord cherchés dans Firestore. Si absent → appel IGDB → stockage en cache.
- Le token Twitch est mis en cache en mémoire avec une marge de sécurité de 1 minute avant expiry.

### Logs
- Toutes les actions importantes (inscription, modifications de profil, critiques, bibliothèque, follows, messages) sont loggées dans la collection `logs`.
- Les administrateurs peuvent consulter les logs via `GET /api/users/logs`.

### Feed — limitation Firestore
- L'opérateur `in` de Firestore est limité à **10 valeurs**. Le feed ne prend que les 10 premiers utilisateurs suivis (`followingIds.slice(0, 10)`).
- ⚠️ À corriger avec une pagination ou une architecture fan-out pour les utilisateurs avec beaucoup d'abonnements.

---

## Conventions de code

- `camelCase` pour les variables et fonctions.
- Code **DRY** — ne pas dupliquer la logique entre controllers.
- Commentaires **minimaux** — uniquement pour les intentions non évidentes, pas pour décrire ce que le code fait déjà.
- Tous les controllers suivent le pattern : `async (req, res, next)` avec `try/catch` qui délègue à `next(error)`.
- **Ne jamais** utiliser `res.status(500)` directement dans un controller — toujours `next(error)`.
- Les IDs numériques IGDB sont toujours convertis en string avec `.toString()` avant stockage Firestore.

---

## TODO / Fonctionnalités planifiées

- [ ] **Pagination** — Ajouter une pagination cursor-based sur le feed et les listings de reviews. *(Partiellement fait - reviews ont pagination, feed limité à 10 follows)*
- [ ] **Correction limite feed** — Gérer les utilisateurs avec plus de 10 abonnements (fan-out ou batch queries).

---

## Variables d'environnement

| Variable | Description | Valeur par défaut |
|---|---|---|
| `PORT` | Port du serveur | `5000` |
| `FIREBASE_PROJECT_ID` | ID du projet Firebase | `sup-content-tristan` |
| `FIRESTORE_EMULATOR_HOST` | Host de l'émulateur Firestore | `database:8081` |
| `FIREBASE_AUTH_EMULATOR_HOST` | Host de l'émulateur Auth | `database:9099` |
| `IGDB_CLIENT_ID` | Client ID Twitch/IGDB | — |
| `IGDB_CLIENT_SECRET` | Client Secret Twitch/IGDB | — |
