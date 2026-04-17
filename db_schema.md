# Schéma de la Base de Données — SkillSwap (MongoDB)

Ce document détaille la structure des collections MongoDB pour le projet SkillSwap.

## Collections

### 1. `users`
Stocke les informations des utilisateurs et leurs identifiants.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Identifiant unique généré par MongoDB |
| `nom` | String | Nom complet ou pseudonyme |
| `email` | String | Email unique (utilisé pour le login) |
| `password_hash` | String | Hash du mot de passe (via bcrypt) |
| `bio` | String | Courte présentation |
| `competences_offertes` | [String] | Liste des compétences que l'utilisateur propose |
| `competences_recherchees` | [String] | Liste des compétences souhaitées en échange |
| `created_at` | Date | Date d'inscription |

### 2. `skills` (Annonces)
Stocke les annonces de partage de compétences.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Identifiant de l'annonce |
| `user_id` | ObjectId | Référence vers l'utilisateur créateur (`users._id`) |
| `titre` | String | Titre de l'annonce |
| `description` | String | Description détaillée |
| `competence_offerte` | String | Compétence que l'utilisateur propose |
| `competence_recherchee` | String | Compétence demandée en échange |
| `created_at` | Date | Date de création |

### 3. `skill_requests` (Matchings)
Gère les demandes d'échange entre deux utilisateurs.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Identifiant de la requête |
| `sender_id` | ObjectId | Utilisateur qui envoie la demande (`users._id`) |
| `receiver_id` | ObjectId | Utilisateur qui reçoit la demande (`users._id`) |
| `skill_id` | ObjectId | Référence vers l'annonce concernée (`skills._id`) |
| `statut` | String | `pending` (défaut), `accepted`, `refused` |
| `message` | String | Message joint à la demande d'échange (optionnel) |
| `created_at` | Date | Date de la demande |

---

## Index recommandés
- `users.email` : Unique index pour garantir l'unicité des comptes.
- `skills.user_id` : Pour accélérer la recherche des annonces par utilisateur.
- `skill_requests.receiver_id` : Pour afficher rapidement les demandes reçues.
