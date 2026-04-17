const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    bio: { type: String, default: '', maxlength: 500 },
    competences_offertes: { type: String, default: '' },
    competences_recherchees: { type: String, default: '' },
    avatar: { type: String, default: null },
    email_verified: { type: Boolean, default: false },
    email_verify_token: { type: String, default: null },
    // Blocage de compte après tentatives échouées
    login_attempts:  { type: Number, default: 0 },
    locked_until:    { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at' } }
);

module.exports = mongoose.model('User', userSchema);
