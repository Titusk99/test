const { validationResult } = require('express-validator');
const Rating = require('../models/Rating');
const SkillRequest = require('../models/SkillRequest');

// POST /api/ratings — laisser une note après un échange accepté
const createRating = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { request_id, note, commentaire } = req.body;

  try {
    const request = await SkillRequest.findById(request_id);

    if (!request) return res.status(404).json({ message: 'Demande introuvable' });

    if (request.statut !== 'accepted') {
      return res.status(400).json({ message: 'Seuls les échanges acceptés peuvent être notés' });
    }

    const isSender = request.sender_id.toString() === req.userId;
    const isReceiver = request.receiver_id.toString() === req.userId;

    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    // La personne notée est l'autre participant
    const reviewed_id = isSender ? request.receiver_id : request.sender_id;

    const existing = await Rating.findOne({ request_id, reviewer_id: req.userId });
    if (existing) {
      return res.status(409).json({ message: 'Vous avez déjà noté cet échange' });
    }

    const rating = await Rating.create({
      request_id,
      reviewer_id: req.userId,
      reviewed_id,
      note,
      commentaire: commentaire || '',
    });

    res.status(201).json(rating);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/ratings/user/:id — voir les notes reçues par un utilisateur
const getUserRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ reviewed_id: req.params.id })
      .populate('reviewer_id', 'nom')
      .sort({ created_at: -1 });

    const average =
      ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r.note, 0) / ratings.length).toFixed(1)
        : null;

    res.json({ average: average ? parseFloat(average) : null, total: ratings.length, ratings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { createRating, getUserRatings };
