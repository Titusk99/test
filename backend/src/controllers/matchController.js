const User = require('../models/User');
const Skill = require('../models/Skill');
const SkillRequest = require('../models/SkillRequest');

const computeScore = (offered, searched) => {
  if (!offered || !searched) return 0;
  const a = offered.toLowerCase();
  const b = searched.toLowerCase();
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 70;
  const wordsA = a.split(/[\s,]+/);
  const wordsB = b.split(/[\s,]+/);
  const common = wordsA.filter(w => wordsB.includes(w) && w.length > 2);
  if (common.length > 0) return 40;
  return 0;
};

// GET /api/match — matching automatique basé sur le profil connecté
const getMyMatches = async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (!me.competences_offertes || !me.competences_recherchees) {
      return res.status(400).json({
        message: 'Complète ton profil avec tes compétences offertes et recherchées pour voir tes matches',
      });
    }

    const skills = await Skill.find({
      user_id: { $ne: req.userId },
      $and: [
        { competence_offerte: { $regex: me.competences_recherchees.split(/[\s,]+/)[0], $options: 'i' } },
        { competence_recherchee: { $regex: me.competences_offertes.split(/[\s,]+/)[0], $options: 'i' } },
      ],
    }).populate('user_id', 'nom bio competences_offertes competences_recherchees');

    const matches = skills.map(skill => {
      const scoreOffer = computeScore(skill.competence_offerte, me.competences_recherchees);
      const scoreSearch = computeScore(skill.competence_recherchee, me.competences_offertes);
      return { ...skill.toObject(), compatibility_score: Math.round((scoreOffer + scoreSearch) / 2) };
    });

    matches.sort((a, b) => b.compatibility_score - a.compatibility_score);

    res.json({ total: matches.length, matches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/v1/match/search?q=excel — recherche full-text (index MongoDB) avec fallback regex
const searchSkills = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ message: 'Recherche trop courte (2 caractères minimum)' });
  }

  const term = q.trim();

  try {
    let skills;

    // Recherche $text (rapide, supporte accents et stemming français)
    skills = await Skill.find(
      { $text: { $search: term } },
      { score: { $meta: 'textScore' } }
    )
      .populate('user_id', 'nom bio')
      .sort({ score: { $meta: 'textScore' } });

    // Fallback regex si $text ne retourne rien (ex: terme trop court ou stopword)
    if (skills.length === 0) {
      const regex = { $regex: term, $options: 'i' };
      skills = await Skill.find({
        $or: [
          { titre: regex },
          { description: regex },
          { competence_offerte: regex },
          { competence_recherchee: regex },
        ],
      })
        .populate('user_id', 'nom bio')
        .sort({ created_at: -1 });
    }

    // Exclure les annonces déjà acceptées
    const acceptedRequests = await SkillRequest.find({ statut: 'accepted' }).select('skill_id');
    const acceptedSkillIds = new Set(acceptedRequests.map(r => r.skill_id.toString()));
    skills = skills.filter(s => !acceptedSkillIds.has(s._id.toString()));

    res.json({ total: skills.length, results: skills });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/match/skill/:id — matching depuis une annonce spécifique
const getMatchesForSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Annonce introuvable' });

    const skills = await Skill.find({
      _id: { $ne: skill._id },
      user_id: { $ne: skill.user_id },
      $and: [
        { competence_offerte: { $regex: skill.competence_recherchee.split(/[\s,]+/)[0], $options: 'i' } },
        { competence_recherchee: { $regex: skill.competence_offerte.split(/[\s,]+/)[0], $options: 'i' } },
      ],
    }).populate('user_id', 'nom bio');

    const matches = skills.map(s => {
      const scoreOffer = computeScore(s.competence_offerte, skill.competence_recherchee);
      const scoreSearch = computeScore(s.competence_recherchee, skill.competence_offerte);
      return { ...s.toObject(), compatibility_score: Math.round((scoreOffer + scoreSearch) / 2) };
    });

    matches.sort((a, b) => b.compatibility_score - a.compatibility_score);

    res.json({ annonce: skill, total: matches.length, matches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getMyMatches, searchSkills, getMatchesForSkill };
