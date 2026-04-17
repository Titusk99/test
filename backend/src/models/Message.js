const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillRequest', required: true, index: true },
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contenu: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: { createdAt: 'created_at' } }
);

module.exports = mongoose.model('Message', messageSchema);
