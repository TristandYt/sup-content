Si vous interressé n'hesitez pas a reprendre le projet.

# 🎮 TGMF (GameList)

TGMF est une plateforme sociale et un gestionnaire de bibliothèque pour les passionnés de jeux vidéo.

Le projet permet de rechercher des jeux, de gérer sa progression, d'interagir avec la communauté via des critiques et des abonnements, et de discuter en privé.

---

## 🚀 Installation & Lancement (Docker)

Le projet utilise **Docker** pour orchestrer simultanément l'API, le client Web et les émulateurs de la base de données.

### 1. Pré-requis

- [Git](https://git-scm.com/) installé sur votre machine.
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installé et en cours d'exécution.
- Node.js (optionnel, uniquement pour lancer la suite de tests en local).

### 2. Cloner et configurer le projet

Ouvrez votre terminal et exécutez les commandes suivantes :

```bash
# Cloner le dépôt Git
git clone <VOTRE_URL_GIT_ICI>
cd sup-content


```

Créer et configurer le fichier d'environnement pour le backend.
Assurez-vous d'avoir un fichier .env dans le dossier /backend avec vos clés IGDB/Firebase.

### 3. Lancer l'infrastructure

À la racine du projet, lancez la commande Docker Compose :

```bash
docker compose up --build -d
```

_Cette commande télécharge les images, installe les dépendances via les volumes virtuels et lance 3 conteneurs :_

- `TGMF-db` : Émulateur Firestore & Auth (Accessible sur http://localhost:4000)
- `TGMF-api` : Backend Express (Accessible sur http://localhost:3000)
- `TGMF-front` : Frontend React/Vite (Accessible sur http://localhost:3001)

Pour arrêter proprement les serveurs et supprimer les conteneurs : `docker compose down`

---

## 🏗️ Architecture Technique

Le projet repose sur une architecture moderne séparant strictement les responsabilités :

1. **Frontend (React / Vite) :** Interface utilisateur dynamique et multilingue gérant la connexion initiale via le SDK client Firebase.
2. **Backend API (Node.js / Express) :** Architecture MVC robuste. L'API vérifie les jetons JWT, traite la logique métier, et s'interface avec l'API externe (IGDB).
3. **Base de données NoSQL (Firestore) :** Structure de données hiérarchique protégée par des règles de sécurité très strictes (`firestore.rules`). L'accès aux données des autres utilisateurs est limité côté client.

---

## ✨ Fonctionnalités Détaillées

### 👤 Utilisateurs, Authentification & Sécurité

- **Connexion Multi-fournisseurs :** Création de compte locale (Email/Mot de passe) ou OAuth2 (Google, GitHub, Facebook) avec provisionnement automatique du profil.
- **Conformité RGPD :** Endpoint dédié permettant à l'utilisateur d'exporter l'intégralité de ses données (Profil, Bibliothèque, Critiques, Abonnements) au format JSON. Option de suppression complète de compte.
- **Bouclier PEGI Dynamique :** Algorithme calculant l'âge de l'utilisateur à partir de sa date de naissance pour filtrer et bloquer l'affichage des jeux inadaptés (+18 ans) en provenance d'IGDB.

### 🎮 Catalogue de Jeux (Intégration IGDB)

- **Mise en cache intelligente :** Les requêtes à l'API IGDB sont d'abord recherchées en base de données locale (`TGMF_cached_at`). Si le jeu est récent en base, l'API tierce n'est pas sollicitée (économie de quotas et performances).
- **Recherche unifiée :** Un contrôleur de recherche global qui croise les jeux IGDB, les utilisateurs locaux et les listes publiques.
- **Recommandations Automatiques :** Moteur suggérant de nouveaux jeux en fonction de l'ajout d'œuvres dans les favoris du joueur.

### 📚 Bibliothèque & Listes de jeux

- **Statuts de Progression :** L'utilisateur peut ajouter n'importe quel jeu à sa ludothèque sous 4 statuts stricts : `to_play`, `playing`, `finished`, ou `dropped`.
- **Tableau de bord :** Calcul des statistiques globales de la ludothèque (Dashboard).
- **Listes personnalisées :** Création de listes thématiques de jeux. Intègre un flag de confidentialité `isPrivate` (protégé par le backend et les rules Firestore).

### 💬 Réseau Social, Critiques et Messagerie

- **Système de notes et commentaires :** Rédaction de critiques (1 à 5 étoiles) associées à un texte, possibilité de _Liker_ et _Commenter_ les avis des autres membres.
- **Abonnements (Followers/Following) :** Possibilité de s'abonner aux profils d'autres joueurs.
- **Messagerie Anti-harcèlement :** Le chat privé `1-to-1` est sécurisé : il requiert obligatoirement un _Mutual Follow_ (suivi mutuel) pour être initié. Intégration d'un système d'accusés de réception (`readBy`).
- **Fil d'actualité Paginé :** Algorithme agrégeant et triant chronologiquement (par `page` et `limit`) les critiques publiées et les ajouts en bibliothèque des personnes suivies.

### 🔔 Temps Réel (Notifications)

- **Server-Sent Events (SSE) :** Le Backend expose une route de streaming `/api/notifications/stream` qui écoute Firestore et "pousse" les mises à jour directement au frontend.
- **Déclencheurs :** Le système alerte instantanément lors d'un nouveau like, d'un nouveau commentaire, ou pousse une recommandation IGDB lorsqu'un jeu est mis en favori.

### 🛡️ Administration & Modération

- **Modération Communautaire :** Route de signalement d'un contenu inapproprié par les membres.
- **Espace Admin :** Les administrateurs peuvent :
  - Bannir des utilisateurs (`adminBanUser`).
  - Supprimer de force des critiques (`adminDeleteReview`).
  - Mettre en avant ("Highlight") des critiques pertinentes.
  - Accéder aux `Logs` générés par les actions sensibles de l'API.

---

## 📖 Guide des Codes d'Erreurs HTTP de l'API

### `200 OK` & `201 Created`

Succès. Les données sont renvoyées ou la ressource a été créée avec succès.

### `400 Bad Request` (Requête invalide)

Renvoyé si les données transmises par le client sont incomplètes ou illogiques.

- Format invalide intercepté par les schémas **Zod** (mot de passe faible, email malformé).
- Erreurs métier de l'API :
  - Essayer de s'abonner à soi-même (`/api/follows`).
  - Envoyer un message vide dans le chat.
  - Statut de jeu inconnu (différent de `playing`, `finished`, etc.).

### `401 Unauthorized` (Non authentifié)

Renvoyé si une route privée est appelée sans jeton valide.

- **Cause :** Token JWT Firebase absent, expiré ou corrompu dans l'en-tête `Authorization: Bearer`.

### `403 Forbidden` (Accès refusé)

L'utilisateur est bien connecté, mais n'a **pas les droits nécessaires** pour l'action demandée.

- **Bouclier PEGI :** Un mineur tente d'accéder aux données d'un jeu classé PEGI 18.
- **Messagerie :** Tentative de création de chat avec une personne sans _suivi mutuel_.
- **Confidentialité :** Lecture d'une liste personnalisée marquée `isPrivate` appartenant à un autre joueur.
- **Administration :** Tentative d'utilisation d'une route de modération sans avoir le rôle `admin`.

### `404 Not Found` (Introuvable)

La ressource demandée n'existe pas dans la base de données.

- **Causes :** Jeu IGDB inconnu, Profil supprimé, ou erreur sur un identifiant de route.

### `409 Conflict` (Conflit de données)

L'action entre en conflit avec l'état actuel du serveur.

- **Causes :** Tentative de création d'un compte avec un pseudo déjà pris, ou tentative de s'abonner à un utilisateur déjà suivi.

### `500 Internal Server Error` (Erreur Serveur)

Un problème inattendu s'est produit côté serveur.

- **Causes :** Panne de Firestore, Timeout de l'API IGDB, ou exception fatale du serveur Node.js.

---

## 🛠️ Scripts & Tests

Le backend est doté d'une suite de **Tests d'Intégration** (`routes.test.js`) basée sur **Jest** et **Supertest** extrêmement complète. Elle mock l'API IGDB, initialise les bases de données émulées, teste l'OAuth et nettoie automatiquement les collections à la fin.

Dans le dossier `backend`, vous pouvez utiliser :

- `npm test` : Exécute l'ensemble de la suite de tests d'intégration.
- `npm start` : Lance le serveur en mode classique hors-docker.
- `npm run dev` : Lance le serveur en mode développement (Nodemon).

À la racine du projet :

- `docker compose down -v` : Arrête les serveurs locaux et supprime les volumes pour réinitialiser la BDD.
