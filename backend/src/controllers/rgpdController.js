const User = require('../models/User');
const Skill = require('../models/Skill');
const SkillRequest = require('../models/SkillRequest');
const Message = require('../models/Message');
const Rating = require('../models/Rating');
const Favorite = require('../models/Favorite');
const Notification = require('../models/Notification');
const logger = require('../config/logger');

// GET /api/rgpd/export — exporter toutes ses données personnelles
const exportData = async (req, res, next) => {
  try {
    const userId = req.userId;

    const [
      user,
      skills,
      requestsSent,
      requestsReceived,
      messages,
      ratingsGiven,
      ratingsReceived,
      favorites,
      notifications,
    ] = await Promise.all([
      User.findById(userId).select('-password_hash -email_verify_token'),
      Skill.find({ user_id: userId }),
      SkillRequest.find({ sender_id: userId }).populate('skill_id', 'titre'),
      SkillRequest.find({ receiver_id: userId }).populate('skill_id', 'titre'),
      Message.find({ sender_id: userId }),
      Rating.find({ reviewer_id: userId }),
      Rating.find({ reviewed_id: userId }).populate('reviewer_id', 'nom'),
      Favorite.find({ user_id: userId }).populate('skill_id', 'titre competence_offerte'),
      Notification.find({ user_id: userId }),
    ]);

    const exportPayload = {
      exported_at: new Date().toISOString(),
      profil: user,
      annonces: skills,
      demandes: {
        envoyees: requestsSent,
        recues: requestsReceived,
      },
      messages,
      notes: {
        donnees: ratingsGiven,
        recues: ratingsReceived,
      },
      favoris: favorites,
      notifications,
    };

    logger.info(`Export RGPD effectué pour l'utilisateur : ${userId}`);

    res.setHeader('Content-Disposition', 'attachment; filename="mes-donnees-skillswap.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(exportPayload);
  } catch (err) {
    next(err);
  }
};

module.exports = { exportData };
