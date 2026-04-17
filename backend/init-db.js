/**
 * init-db.js
 * Script d'initialisation de la base de données SkillSwap (MongoDB)
 * Crée les collections et les index nécessaires.
 *
 * Utilisation : node init-db.js
 * Prérequis : npm install mongoose dotenv
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap';

// ─────────────────────────────────────────────
// Définition des Schémas Mongoose
// ─────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true, // Index unique créé automatiquement
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Format email invalide'],
    },
    password_hash: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'La bio ne peut pas dépasser 500 caractères'],
    },
    competences_offertes: {
      type: [String],
      default: [],
    },
    competences_recherchees: {
      type: [String],
      default: [],
    },
  },
  { timestamps: { createdAt: 'created_at' } }
);

const skillSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "L'utilisateur est obligatoire"],
      index: true, // Index pour accélérer les recherches par utilisateur
    },
    titre: {
      type: String,
      required: [true, 'Le titre est obligatoire'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La description est obligatoire'],
    },
    competence_offerte: {
      type: String,
      required: [true, 'La compétence offerte est obligatoire'],
      trim: true,
    },
    competence_recherchee: {
      type: String,
      required: [true, 'La compétence recherchée est obligatoire'],
      trim: true,
    },
  },
  { timestamps: { createdAt: 'created_at' } }
);

const skillRequestSchema = new mongoose.Schema(
  {
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index pour récupérer rapidement les demandes reçues
    },
    skill_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    statut: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'refused'],
        message: 'Statut invalide. Valeurs acceptées : pending, accepted, refused',
      },
      default: 'pending',
    },
    message: {
      type: String,
      default: '',
      maxlength: [1000, 'Le message ne peut pas dépasser 1000 caractères'],
    },
  },
  { timestamps: { createdAt: 'created_at' } }
);

// ─────────────────────────────────────────────
// Enregistrement des modèles & Initialisation
// ─────────────────────────────────────────────

async function initDatabase() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Connecté à : ${MONGODB_URI}`);

    // Enregistrement des modèles (crée les collections et les index)
    mongoose.model('User', userSchema);
    mongoose.model('Skill', skillSchema);
    mongoose.model('SkillRequest', skillRequestSchema);

    // Forcer la synchronisation des index MongoDB
    console.log('\n📦 Création des collections et des index...');
    for (const modelName of mongoose.modelNames()) {
      const model = mongoose.model(modelName);
      await model.createIndexes();
      console.log(`  ✔ Collection "${model.collection.name}" initialisée.`);
    }

    console.log('\n🎉 Base de données "skillswap" initialisée avec succès !');
    console.log('   Vous pouvez maintenant lancer le serveur ou exécuter seed.js pour les données de test.');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation :', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnexion de MongoDB.');
  }
}

initDatabase();
