const mongoose = require('mongoose');

const skillRequestSchema = new mongoose.Schema(
  {
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skill_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    message: { type: String, default: null, maxlength: 500 },
    statut: { type: String, enum: ['pending', 'accepted', 'refused', 'archived'], default: 'pending' },
    archived_at: { type: Date, default: null },
    archived_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: 'created_at' } }
);

module.exports = mongoose.model('SkillRequest', skillRequestSchema);
