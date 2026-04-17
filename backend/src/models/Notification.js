const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['new_request', 'request_accepted', 'request_refused', 'new_message', 'new_rating'],
      required: true,
    },
    message: { type: String, required: true },
    ref_id: { type: mongoose.Schema.Types.ObjectId, default: null }, // ID de la ressource liée
    lu: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at' } }
);

module.exports = mongoose.model('Notification', notificationSchema);
