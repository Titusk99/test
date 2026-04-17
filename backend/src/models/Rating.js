const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillRequest', required: true, unique: true },
    reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewed_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    note: { type: Number, required: true, min: 1, max: 5 },
    commentaire: { type: String, default: '', maxlength: 500, trim: true },
  },
  { timestamps: { createdAt: 'created_at' } }
);

module.exports = mongoose.model('Rating', ratingSchema);
