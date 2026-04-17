const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  expires_at: { type: Date, required: true },
  used: { type: Boolean, default: false },
});

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
