const User = require('../models/User');
const Skill = require('../models/Skill');
const SkillRequest = require('../models/SkillRequest');
const Rating = require('../models/Rating');
const Message = require('../models/Message');

// GET /api/stats — statistiques globales de la plateforme (public)
const getGlobalStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      totalSkills,
      totalRequests,
      acceptedRequests,
      totalMessages,
      ratingStats,
      topSkillsOffered,
      topSkillsWanted,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ email_verified: true }),
      Skill.countDocuments(),
      SkillRequest.countDocuments(),
      SkillRequest.countDocuments({ statut: 'accepted' }),
      Message.countDocuments(),

      // Moyenne globale des notes
      Rating.aggregate([
        { $group: { _id: null, moyenne: { $avg: '$note' }, total: { $sum: 1 } } },
      ]),

      // Top 5 compétences les plus offertes
      Skill.aggregate([
        { $group: { _id: '$competence_offerte', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      // Top 5 compétences les plus recherchées
      Skill.aggregate([
        { $group: { _id: '$competence_recherchee', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      // 5 derniers inscrits
      User.find().select('nom created_at avatar').sort({ created_at: -1 }).limit(5),
    ]);

    const tauxAcceptation = totalRequests > 0
      ? Math.round((acceptedRequests / totalRequests) * 100)
      : 0;

    res.json({
      plateforme: {
        utilisateurs: { total: totalUsers, verifies: verifiedUsers },
        annonces: totalSkills,
        echanges: {
          total: totalRequests,
          acceptes: acceptedRequests,
          taux_acceptation: `${tauxAcceptation}%`,
        },
        messages: totalMessages,
        notes: {
          moyenne: ratingStats[0] ? parseFloat(ratingStats[0].moyenne.toFixed(1)) : null,
          total: ratingStats[0]?.total || 0,
        },
      },
      tendances: {
        competences_les_plus_offertes: topSkillsOffered.map(s => ({ competence: s._id, annonces: s.count })),
        competences_les_plus_recherchees: topSkillsWanted.map(s => ({ competence: s._id, annonces: s.count })),
      },
      derniers_inscrits: recentUsers,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/stats/me — statistiques personnelles de l'utilisateur connecté
const getMyStats = async (req, res, next) => {
  try {
    const [
      mySkills,
      requestsSent,
      requestsReceived,
      acceptedExchanges,
      myRatings,
      myMessages,
      myFavorites,
    ] = await Promise.all([
      Skill.countDocuments({ user_id: req.userId }),
      SkillRequest.countDocuments({ sender_id: req.userId }),
      SkillRequest.countDocuments({ receiver_id: req.userId }),
      SkillRequest.countDocuments({
        statut: 'accepted',
        $or: [{ sender_id: req.userId }, { receiver_id: req.userId }],
      }),
      Rating.aggregate([
        { $match: { reviewed_id: req.userId } },
        { $group: { _id: null, moyenne: { $avg: '$note' }, total: { $sum: 1 } } },
      ]),
      Message.countDocuments({ sender_id: req.userId }),
      require('../models/Favorite').countDocuments({ user_id: req.userId }),
    ]);

    res.json({
      annonces: mySkills,
      demandes: {
        envoyees: requestsSent,
        recues: requestsReceived,
        echanges_acceptes: acceptedExchanges,
      },
      reputation: {
        note_moyenne: myRatings[0] ? parseFloat(myRatings[0].moyenne.toFixed(1)) : null,
        nombre_notes: myRatings[0]?.total || 0,
      },
      messages_envoyes: myMessages,
      favoris: myFavorites,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getGlobalStats, getMyStats };
