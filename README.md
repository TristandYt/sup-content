# 🎮 SUPCONTENT (GameList)

SUPCONTENT est une plateforme sociale et un gestionnaire de bibliothèque pour les passionnés de jeux vidéo.

Le projet permet de rechercher des jeux, de gérer sa progression, d'interagir avec la communauté via des critiques et des abonnements, et de discuter en privé.

---

## Comment marche le projet ?

Le projet est divisé en deux parties principales interagissant via une API REST :

1. **Frontend (React) :** Interface utilisateur dynamique (thème sombre/clair, multilingue) qui s'occupe de l'authentification directe avec le SDK Firebase.
2. **Backend (Node.js / Express) :** Serveur API sécurisé. Il vérifie les tokens JWT de Firebase pour chaque requête protégée, communique avec la base de données Firestore, et fait le pont avec l'API externe des jeux vidéo (**IGDB / Twitch**).
3. **Infrastructure (Docker) :** L'environnement de développement repose sur des conteneurs Docker émulant la base de données Firestore et l'Authentification Firebase en local, ce qui permet de tester l'application sans risquer de polluer une base de données de production.

---

## Fonctionnalités Principales

### Gestion des Utilisateurs et Profils
- **Authentification sécurisée :** Inscription et connexion via Firebase Auth (Email/Mot de passe ou OAuth via Google, GitHub, Facebook).
- **Préférences & RGPD :** Thème (Clair/Sombre), langue, options de notifications (Push/Email) et export JSON de toutes les données.
- **Jeux Favoris :** Mise en avant de ses jeux "coup de cœur" sur son profil.

### Catalogue de Jeux (Propulsé par IGDB)
- **Base de données mondiale :** Recherche de jeux, consultation des jeux populaires et recommandations intelligentes basées sur les favoris.
- **Mise en cache (Performances) :** Les résultats d'IGDB sont sauvegardés dans Firestore pour réduire le temps d'attente et économiser les quotas d'API.
- **Bouclier PEGI (Contrôle parental) :** Blocage automatique et masquage des jeux inappropriés (ex: +18) selon l'âge calculé à partir de la date de naissance de l'utilisateur.

### Bibliothèque et Listes Personnalisées
- **Tracking de progression :** Ajout de jeux à sa bibliothèque avec un statut précis (`to_play`, `playing`, `finished`, `dropped`).
- **Tableau de bord :** Statistiques globales de la bibliothèque.
- **Listes personnalisées :** Création de listes thématiques (ex: "Mes jeux d'horreur", "À faire en coop") qui peuvent être publiques ou privées.

### Critiques et Interactions Sociales
- **Système d'avis :** Rédaction de critiques avec une note de 1 à 5 étoiles.
- **Interactions :** Possibilité de "Liker" ou de "Commenter" les critiques des autres joueurs.
- **Réseau d'abonnements :** Suivi (Follow/Unfollow) d'autres utilisateurs pour ne rien rater de leur activité.
- **Fil d'actualité (Feed) :** Flux personnalisé affichant chronologiquement les **critiques publiées** ET les **ajouts en bibliothèque** des amis.
- **Notifications intelligentes :** Alertes in-app (nouveaux abonnés, likes, commentaires) et système de recommandation automatique basée sur l'ajout de favoris.

### Messagerie Privée (Chat)
- **Conversations 1-to-1 :** Échange de messages texte ou de pièces jointes.
- **Anti-Harcelement (Mutual Follow) :** Le chat est bloqué si les deux utilisateurs ne se suivent pas mutuellement.
- **Accusés de réception :** Suivi de lecture des messages (système de *Read Receipts*).

### Modération & Administration
- **Signalements :** Les utilisateurs peuvent signaler un comportement toxique ou du contenu inapproprié.
- **Outils Admin :** 
  - Bannissement d'utilisateurs (`adminBanUser`).
  - Suppression forcée de critiques (`adminDeleteReview`).
  - Mise en avant ("Highlight") de critiques pertinentes.
  - Accès à l'historique complet des actions de sécurité (`Logs`).

---

## Guide des Codes d'Erreurs HTTP (API)

L'API backend est standardisée. Voici comment interpréter les erreurs renvoyées :

### `200 OK` / `201 Created`
La requête a réussi. Les données demandées sont renvoyées ou la ressource a bien été créée (ex: envoi d'un message, création d'une liste).

### `400 Bad Request` (Requête invalide)
Renvoié lorsque les données envoyées par le client sont incomplètes ou illogiques.
- **Validation Zod :** Mot de passe trop court, email mal formaté.
- **Erreurs métier :** 
  - Essayer de s'abonner à soi-même (`/api/follows`).
  - Envoyer un message vide dans le chat.
  - Fournir un statut de bibliothèque invalide (autre que `playing`, `finished`, etc.).

### `401 Unauthorized` (Non authentifié)
Renvoié lorsqu'une route privée est appelée sans jeton d'authentification valide.
- **Causes :** Token Firebase absent, expiré ou invalide dans le header `Authorization: Bearer <token>`.

### `403 Forbidden` (Accès refusé)
L'utilisateur est bien connecté, mais n'a **pas les droits nécessaires** pour l'action demandée.
- **Bouclier PEGI :** L'utilisateur est mineur et tente d'afficher un jeu classé PEGI 18.
- **Messagerie :** Tentative de création de chat avec une personne sans *suivi mutuel*.
- **Confidentialité :** Tentative de lecture d'une liste personnalisée réglée sur "Privée" appartenant à un autre utilisateur, ou lecture d'une conversation à laquelle on ne participe pas.
- **Administration :** Tentative d'utilisation d'une route de modération sans avoir le rôle `admin`.

### `404 Not Found` (Introuvable)
La ressource demandée n'existe pas dans la base de données.
- **Causes :** 
  - Identifiant de jeu IGDB inconnu.
  - Profil utilisateur supprimé ou inexistant.
  - Retrait d'un jeu de la bibliothèque qui n'y figurait déjà plus.

### `409 Conflict` (Conflit de données)
L'action entre en conflit avec l'état actuel du serveur.
- **Causes :** 
  - Tentative de s'abonner à un utilisateur que l'on suit déjà.

### `500 Internal Server Error` (Erreur Serveur)
Un problème inattendu s'est produit côté serveur.
- **Causes :** 
  - Crash de la base de données (Firestore).
  - Panne ou timeout de l'API IGDB / Twitch.
  - Erreur de logique non attrapée dans le code.

---

## Scripts et Commandes

- `npm start` : Lance l'infrastructure Docker en arrière plan.
- `npm test` : Exécute la suite de tests complète (Jest + Supertest) avec purge et peuplement de la BDD d'émulation.
- `npm run clean` : Supprime les conteneurs et vide les volumes de données Docker.