const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    titre: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    competence_offerte: { type: String, required: true, trim: true },
    competence_recherchee: { type: String, required: true, trim: true },
    statut: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: { createdAt: 'created_at' } }
);

// Index full-text sur les champs de recherche
skillSchema.index(
  { titre: 'text', description: 'text', competence_offerte: 'text', competence_recherchee: 'text' },
  {
    weights: { competence_offerte: 3, competence_recherchee: 3, titre: 2, description: 1 },
    name: 'skill_fulltext',
    default_language: 'french',
  }
);

module.exports = mongoose.model('Skill', skillSchema);
