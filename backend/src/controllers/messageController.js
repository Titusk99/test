const { validationResult } = require('express-validator');
const Message = require('../models/Message');
const SkillRequest = require('../models/SkillRequest');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { getIO } = require('../config/socket');

const isParticipant = (request, userId) =>
  request.sender_id.toString() === userId || request.receiver_id.toString() === userId;

// POST /api/messages — envoyer un message
const sendMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { request_id, contenu } = req.body;

  try {
    const request = await SkillRequest.findById(request_id);
    if (!request) return res.status(404).json({ message: 'Échange introuvable' });

    if (!['pending', 'accepted'].includes(request.statut)) {
      return res.status(400).json({ message: 'La messagerie est disponible uniquement pour les échanges en attente ou acceptés' });
    }

    if (!isParticipant(request, req.userId)) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    const message = await Message.create({ request_id, sender_id: req.userId, contenu });
    await message.populate('sender_id', 'nom');

    // Notification à l'autre participant
    const recipientId = request.sender_id.toString() === req.userId
      ? request.receiver_id
      : request.sender_id;

    const sender = await User.findById(req.userId).select('nom');
    await createNotification(
      recipientId,
      'new_message',
      `${sender.nom} t'a envoyé un message`,
      request_id
    );

    // Pousser le message en temps réel aux participants de la conversation
    try {
      getIO().to(`conv:${request_id}`).emit('new_message', message);
    } catch { /* socket non dispo en test */ }

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/messages/:request_id — récupérer la conversation
const getConversation = async (req, res) => {
  try {
    const request = await SkillRequest.findById(req.params.request_id);
    if (!request) return res.status(404).json({ message: 'Échange introuvable' });

    if (!isParticipant(request, req.userId)) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    const messages = await Message.find({ request_id: req.params.request_id })
      .populate('sender_id', 'nom avatar')
      .sort({ created_at: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { sendMessage, getConversation };
