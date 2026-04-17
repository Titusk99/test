# SkillSwap — Échange de compétences entre étudiants

SkillSwap est une plateforme web permettant aux étudiants de partager leurs connaissances et compétences gratuitement. Le principe est simple : proposez ce que vous savez faire et trouvez quelqu'un qui peut vous apprendre ce dont vous avez besoin.

## 🌍 Application en ligne

| Service | URL |
|---|---|
| **Frontend** | https://skillswap-zeta-six.vercel.app |
| **Backend API** | https://skillswap-backend-imc5.onrender.com/api/v1 |
| **Documentation Swagger** | https://skillswap-backend-imc5.onrender.com/api/docs |

> ⚠️ Le backend est hébergé sur Render en tier gratuit — il peut mettre **30-60 secondes** à répondre après une période d'inactivité (cold start).

---

## 👥 L'Équipe

| Membre | Rôle |
|---|---|
| **Walide** | Backend — logique serveur, authentification, API REST, sécurité, base de données |
| **Michel** | GitHub & BDD — gestion du dépôt, architecture de branches, schéma MongoDB |
| **Sarah** | Frontend — interface utilisateur (UI/UX), intégration API, responsive design |
| **Melina** | Frontend & soutenance — UX/UI, composants additionnels, présentation |

---

## 🛠 Stack Technique & Déploiement

| Couche | Technologie |
|---|---|
| Frontend | Vue.js 3 + Vite |
| Backend | Node.js + Express.js |
| Base de données | MongoDB Atlas (cloud partagé, région EU Paris) |
| Hébergement backend | Render (Frankfurt) |
| Hébergement frontend | Vercel |
| Temps réel | Socket.io |
| Authentification | JWT (access token 15 min) + Refresh Token (30 jours, rotation) |
| Sécurité | Helmet, CORS, HPP, express-mongo-sanitize, rate limiting, bcrypt |
| Documentation API | Swagger UI (`/api/docs`) |

---

## ✨ Fonctionnalités

### Authentification & Compte
- Inscription avec validation du mot de passe (8 car. min, majuscule, chiffre, caractère spécial)
- Connexion avec verrouillage du compte après 5 tentatives échouées (15 min)
- Vérification d'email
- Réinitialisation du mot de passe par email
- Refresh token avec rotation automatique
- Suppression du compte avec suppression en cascade de toutes les données

### Annonces de compétences
- Création, modification, suppression d'annonces
- Activation / mise en pause manuelle d'une annonce
- Pagination (12 annonces par page)
- Filtrage par compétence offerte ou recherchée
- Recherche full-text avec fallback regex

### Matching
- Algorithme de compatibilité (score 100 / 70 / 40 selon la précision du match)
- Suggestions triées par score de compatibilité
- Exclusion des échanges déjà acceptés

### Demandes d'échange & Messagerie
- Envoi d'une demande d'échange depuis une annonce
- Acceptation ou refus d'une demande directement dans la messagerie
- Conversation floutée tant que la demande n'est pas acceptée
- Messagerie temps réel via Socket.io (rooms par conversation)
- Notifications automatiques à chaque action

### Profil utilisateur
- Édition du profil (nom, bio, compétences)
- Upload et changement d'avatar
- Liste de ses propres annonces avec gestion du statut

### Favoris
- Ajout / suppression d'annonces en favoris

### Notes
- Notation d'un échange (1 à 5 étoiles + commentaire)
- Affichage de la note moyenne d'un utilisateur

### Archivage
- Archivage des échanges terminés
- Suppression définitive d'une archive

### Statistiques
- Statistiques globales de la plateforme (nb utilisateurs, annonces, échanges, taux d'acceptation, top compétences)
- Statistiques personnelles (échanges, notes, messages, favoris)

### RGPD
- Export complet des données personnelles au format JSON (profil, annonces, messages, notes, favoris, notifications)
- Page RGPD dédiée accessible depuis le footer

---

## 🚀 Installation & Lancement

### Prérequis
- [Node.js](https://nodejs.org/) v16+
- Un compte [MongoDB Atlas](https://www.mongodb.com/atlas) **ou** MongoDB installé en local

### 1. Clonage du projet
```bash
git clone https://github.com/Titusk99/Ghazanfar_Khauv_Djedaimi_Toussaint.git
cd Ghazanfar_Khauv_Djedaimi_Toussaint
```

### 2. Installation des dépendances
```bash
npm run install:all
```

### 3. Configuration
Copiez le fichier `.env.example` vers `backend/.env` :
```bash
cp backend/.env.example backend/.env
```

Contenu du fichier `backend/.env` :
```env
PORT=3000

# MongoDB Atlas (base partagée)
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/skillswap?retryWrites=true&w=majority

# Ou MongoDB local
# MONGODB_URI=mongodb://localhost:27017/skillswap

JWT_SECRET=change_me_en_prod
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=30

CLIENT_URL=http://localhost:5173

# Email (optionnel — désactiver pour le dev)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=no-reply@skillswap.fr
EMAIL_PASS=your_password
```

### 4. Données de test (seed)

Le script génère **30 utilisateurs** et **63 annonces** couvrant tous les domaines (dev web, data/IA, DevOps, cybersécurité, design, mobile, langues...) ainsi que **14 demandes d'échange** (pending, accepted, refused).

```bash
node backend/seed.js
```

> ⚠️ Le script vide les collections existantes avant de les repeupler. À relancer à chaque fois que vous voulez repartir d'une base propre.

**Mot de passe universel pour tous les comptes :** `Efrei2026!`

Exemples de comptes :

| Email | Offre | Cherche |
|---|---|---|
| alice.martin@efrei.fr | React | Python |
| bob.dupont@efrei.fr | Python | React |
| emma.leroy@efrei.fr | Figma | Docker |
| lucas.bernard@efrei.fr | Docker | Figma |
| sarah.petit@efrei.fr | Cybersécurité | Flutter |
| thomas.moreau@efrei.fr | Flutter | Cybersécurité |
| camille.simon@efrei.fr | Node.js | SQL |
| maxime.laurent@efrei.fr | SQL | Node.js |

### 5. Démarrage
```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api/v1 |
| Documentation Swagger | http://localhost:3000/api/docs |

---

## 🗂 Structure du projet

```
├── backend/
│   ├── src/
│   │   ├── config/         # Socket.io, Swagger, logger Winston
│   │   ├── controllers/    # Logique métier (auth, skills, messages, etc.)
│   │   ├── middlewares/    # Auth JWT, rate limiter, pagination, sanitisation
│   │   ├── models/         # Schémas Mongoose
│   │   └── routes/         # Définition des routes API
│   ├── test_unitaire/      # Tests unitaires et d'intégration (Jest + Supertest)
│   ├── seed.js             # Script de peuplement de la base
│   └── server.js           # Point d'entrée du serveur
└── frontend/
    └── src/
        ├── api/            # Couche d'appel API centralisée
        ├── components/     # Composants réutilisables (SkillsList, etc.)
        ├── router/         # Vue Router
        └── views/          # Pages (Home, Profile, Messages, Skills, RGPD...)
```

---

## 🔌 API — Endpoints principaux

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Inscription |
| `POST` | `/api/v1/auth/login` | Connexion |
| `POST` | `/api/v1/auth/logout` | Déconnexion |
| `POST` | `/api/v1/auth/refresh` | Renouvellement du JWT |
| `GET` | `/api/v1/skills` | Liste des annonces (paginée) |
| `POST` | `/api/v1/skills` | Créer une annonce |
| `PATCH` | `/api/v1/skills/:id/statut` | Activer / mettre en pause une annonce |
| `GET` | `/api/v1/match` | Suggestions de matching |
| `GET` | `/api/v1/match/search?q=` | Recherche full-text |
| `POST` | `/api/v1/requests` | Envoyer une demande d'échange |
| `PUT` | `/api/v1/requests/:id` | Accepter / refuser une demande |
| `POST` | `/api/v1/messages` | Envoyer un message |
| `GET` | `/api/v1/messages/:request_id` | Récupérer une conversation |
| `GET` | `/api/v1/notifications` | Mes notifications |
| `GET` | `/api/v1/stats` | Statistiques globales |
| `GET` | `/api/v1/stats/me` | Mes statistiques |
| `GET` | `/api/v1/rgpd/export` | Export RGPD (JSON) |

> La documentation complète est disponible sur **http://localhost:3000/api/docs**

---

## 🛡 Sécurité

- **JWT** avec blacklist à la déconnexion
- **Refresh tokens** rotatifs (un token = un usage)
- **Verrouillage de compte** après 5 tentatives échouées
- **Rate limiting** : 100 req/15min (global), 10 req/15min (routes auth)
- **Helmet** : headers HTTP sécurisés
- **HPP** : protection contre la pollution des paramètres HTTP
- **express-mongo-sanitize** : protection contre les injections NoSQL
- **Sanitisation XSS** sur body, query et params
- **Validation stricte** de tous les champs entrants (express-validator)
- **Mot de passe hashé** avec bcrypt (salt 12)

---

## 🧪 Tests

```bash
# Tests unitaires
npm run test --prefix backend

# Tests d'intégration
npm run test:integration --prefix backend
```

Les tests couvrent : `authController`, `skillController`, `matchController`, `messageController`, `requestController`, `notificationController`, `ratingController`, `favoriteController`, `archiveController`, `statsController`, `rgpdController`, `userController`, `passwordResetController`.

---

## 🗃 Structure de la base de données

| Collection | Description |
|---|---|
| `users` | Profils utilisateurs, hash mot de passe, tentatives de connexion |
| `skills` | Annonces de compétences avec statut active/inactive |
| `skillrequests` | Demandes d'échange entre utilisateurs |
| `messages` | Messages des conversations |
| `notifications` | Notifications temps réel |
| `ratings` | Notes et commentaires post-échange |
| `favorites` | Favoris par utilisateur |
| `archives` | Échanges archivés |
| `refreshtokens` | Tokens de renouvellement JWT |
| `tokenblacklists` | JWTs révoqués (logout) |
| `passwordresets` | Tokens de réinitialisation de mot de passe |
