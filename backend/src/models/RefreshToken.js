const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token:      { type: String, required: true, unique: true },
  expires_at: { type: Date, required: true },
});

// Auto-suppression après expiration
refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
