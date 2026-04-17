const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skill_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  },
  { timestamps: { createdAt: 'created_at' } }
);

// Un utilisateur ne peut pas mettre la même annonce en favori deux fois
favoriteSchema.index({ user_id: 1, skill_id: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
