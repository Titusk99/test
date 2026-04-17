const { validationResult } = require('express-validator');
const SkillRequest = require('../models/SkillRequest');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Message = require('../models/Message');
const { createNotification } = require('./notificationController');

const sendRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { receiver_id, skill_id, message } = req.body;

  if (receiver_id === req.userId) {
    return res.status(400).json({ message: 'Vous ne pouvez pas vous envoyer une demande à vous-même' });
  }

  try {
    const [receiver, skill] = await Promise.all([
      User.findById(receiver_id),
      Skill.findById(skill_id),
    ]);

    if (!receiver) return res.status(404).json({ message: 'Utilisateur destinataire introuvable' });
    if (!skill) return res.status(404).json({ message: 'Annonce introuvable' });

    const existing = await SkillRequest.findOne({
      sender_id: req.userId,
      receiver_id,
      skill_id,
      statut: 'pending',
    });

    if (existing) {
      return res.status(409).json({ message: 'Une demande est déjà en attente pour cette annonce' });
    }

    const request = await SkillRequest.create({
      sender_id: req.userId,
      receiver_id,
      skill_id,
      message: message || null,
    });

    // Création automatique du premier message dans la conversation
    if (message && message.trim()) {
      await Message.create({
        request_id: request._id,
        sender_id: req.userId,
        contenu: message.trim()
      });
    }

    // Notification automatique au destinataire
    const sender = await User.findById(req.userId).select('nom');
    await createNotification(
      receiver_id,
      'new_request',
      `${sender.nom} t'a envoyé une demande d'échange pour "${skill.titre}"`,
      request._id
    );

    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const [sent, received] = await Promise.all([
      SkillRequest.find({ sender_id: req.userId })
        .populate('receiver_id', 'nom avatar')
        .populate('skill_id', 'titre competence_offerte competence_recherchee')
        .sort({ created_at: -1 }),
      SkillRequest.find({ receiver_id: req.userId })
        .populate('sender_id', 'nom avatar')
        .populate('skill_id', 'titre competence_offerte competence_recherchee')
        .sort({ created_at: -1 }),
    ]);

    res.json({ sent, received });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { statut } = req.body;

  try {
    const request = await SkillRequest.findById(req.params.id).populate('skill_id', 'titre');
    if (!request) return res.status(404).json({ message: 'Demande introuvable' });

    if (request.receiver_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    if (request.statut !== 'pending') {
      return res.status(400).json({ message: 'Cette demande a déjà été traitée' });
    }

    request.statut = statut;
    await request.save();

    // Notification automatique à l'envoyeur
    const receiver = await User.findById(req.userId).select('nom');
    const notifType = statut === 'accepted' ? 'request_accepted' : 'request_refused';
    const notifMsg = statut === 'accepted'
      ? `${receiver.nom} a accepté ta demande d'échange pour "${request.skill_id.titre}"`
      : `${receiver.nom} a refusé ta demande d'échange pour "${request.skill_id.titre}"`;

    await createNotification(request.sender_id, notifType, notifMsg, request._id);

    res.json({ id: request._id, statut, message: `Demande ${statut === 'accepted' ? 'acceptée' : 'refusée'}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { sendRequest, getMyRequests, updateRequest };
