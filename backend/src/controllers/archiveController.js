const SkillRequest = require('../models/SkillRequest');
const logger = require('../config/logger');

// PUT /api/archive/:request_id — archiver un échange terminé
const archiveRequest = async (req, res, next) => {
  try {
    const request = await SkillRequest.findById(req.params.request_id);
    if (!request) return res.status(404).json({ message: 'Échange introuvable' });

    const isParticipant =
      request.sender_id.toString() === req.userId ||
      request.receiver_id.toString() === req.userId;

    if (!isParticipant) return res.status(403).json({ message: 'Action non autorisée' });

    if (!['accepted', 'refused'].includes(request.statut)) {
      return res.status(400).json({ message: 'Seuls les échanges terminés (acceptés ou refusés) peuvent être archivés' });
    }

    request.statut = 'archived';
    request.archived_at = new Date();
    request.archived_by = req.userId;
    await request.save();

    logger.info(`Échange archivé : ${request._id} par ${req.userId}`);
    res.json({ message: 'Échange archivé avec succès', request });
  } catch (err) {
    next(err);
  }
};

// GET /api/archive — voir ses échanges archivés
const getArchivedRequests = async (req, res, next) => {
  const { limit, skip } = req.pagination;
  try {
    const filter = {
      statut: 'archived',
      $or: [{ sender_id: req.userId }, { receiver_id: req.userId }],
    };

    const [requests, total] = await Promise.all([
      SkillRequest.find(filter)
        .populate('sender_id', 'nom avatar')
        .populate('receiver_id', 'nom avatar')
        .populate('skill_id', 'titre competence_offerte competence_recherchee')
        .sort({ archived_at: -1 })
        .skip(skip)
        .limit(limit),
      SkillRequest.countDocuments(filter),
    ]);

    res.json(req.paginate(total, requests));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/archive/:request_id — supprimer définitivement un échange archivé
const deleteArchivedRequest = async (req, res, next) => {
  try {
    const request = await SkillRequest.findById(req.params.request_id);
    if (!request) return res.status(404).json({ message: 'Échange introuvable' });

    const isParticipant =
      request.sender_id.toString() === req.userId ||
      request.receiver_id.toString() === req.userId;

    if (!isParticipant) return res.status(403).json({ message: 'Action non autorisée' });

    if (request.statut !== 'archived') {
      return res.status(400).json({ message: 'Seuls les échanges archivés peuvent être supprimés définitivement' });
    }

    await request.deleteOne();
    logger.info(`Échange archivé supprimé définitivement : ${req.params.request_id}`);
    res.json({ message: 'Échange supprimé définitivement' });
  } catch (err) {
    next(err);
  }
};

module.exports = { archiveRequest, getArchivedRequests, deleteArchivedRequest };
