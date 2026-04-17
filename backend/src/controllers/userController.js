const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Skill = require('../models/Skill');
const SkillRequest = require('../models/SkillRequest');
const Message = require('../models/Message');
const Rating = require('../models/Rating');
const Favorite = require('../models/Favorite');
const Notification = require('../models/Notification');
const TokenBlacklist = require('../models/TokenBlacklist');
const logger = require('../config/logger');

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password_hash -email_verify_token');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  if (req.params.id !== req.userId) {
    return res.status(403).json({ message: 'Action non autorisée' });
  }

  const { nom, bio, competences_offertes, competences_recherchees } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { nom, bio, competences_offertes, competences_recherchees },
      { new: true, runValidators: true }
    ).select('-password_hash -email_verify_token');

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Suppression en cascade — nettoie toutes les données liées à l'utilisateur
const deleteUser = async (req, res, next) => {
  if (req.params.id !== req.userId) {
    return res.status(403).json({ message: 'Action non autorisée' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    // Récupérer les IDs des annonces pour supprimer les données liées
    const skills = await Skill.find({ user_id: req.userId }).select('_id');
    const skillIds = skills.map(s => s._id);

    // Récupérer les IDs des demandes pour supprimer les messages liés
    const requests = await SkillRequest.find({
      $or: [{ sender_id: req.userId }, { receiver_id: req.userId }],
    }).select('_id');
    const requestIds = requests.map(r => r._id);

    // Suppression en cascade en parallèle
    await Promise.all([
      Skill.deleteMany({ user_id: req.userId }),
      SkillRequest.deleteMany({ $or: [{ sender_id: req.userId }, { receiver_id: req.userId }] }),
      Message.deleteMany({ $or: [{ sender_id: req.userId }, { request_id: { $in: requestIds } }] }),
      Rating.deleteMany({ $or: [{ reviewer_id: req.userId }, { reviewed_id: req.userId }] }),
      Favorite.deleteMany({ $or: [{ user_id: req.userId }, { skill_id: { $in: skillIds } }] }),
      Notification.deleteMany({ user_id: req.userId }),
      TokenBlacklist.deleteMany({ token: req.token }),
    ]);

    // Supprimer l'avatar du disque
    if (user.avatar) {
      const avatarPath = path.join('uploads/avatars', path.basename(user.avatar));
      if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
    }

    await user.deleteOne();

    logger.info(`Compte supprimé en cascade : ${req.userId}`);
    res.json({ message: 'Compte et toutes les données associées supprimés avec succès' });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/:id/avatar
const uploadAvatar = async (req, res, next) => {
  if (req.params.id !== req.userId) {
    return res.status(403).json({ message: 'Action non autorisée' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier reçu' });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (user.avatar) {
      const oldPath = path.join('uploads/avatars', path.basename(user.avatar));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = `${process.env.API_URL || 'http://localhost:3000'}/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

    res.json({ avatar: avatarUrl });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUser, updateUser, deleteUser, uploadAvatar };
