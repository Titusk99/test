const { validationResult } = require('express-validator');
const Skill = require('../models/Skill');
const logger = require('../config/logger');

const createSkill = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { titre, description, competence_offerte, competence_recherchee } = req.body;

  try {
    const skill = await Skill.create({ user_id: req.userId, titre, description, competence_offerte, competence_recherchee });
    logger.info(`Nouvelle annonce créée : "${titre}" par user ${req.userId}`);
    res.status(201).json(skill);
  } catch (err) {
    next(err);
  }
};

// GET /api/skills?competence=&offre=&cherche=&page=1&limit=20
const getAllSkills = async (req, res, next) => {
  const { competence, offre, cherche } = req.query;
  const { limit, skip } = req.pagination;

  try {
    // N'afficher que les annonces actives (ou sans champ statut = données existantes avant la migration)
    const filter = { statut: { $ne: 'inactive' } };
    if (offre) filter.competence_offerte = { $regex: offre, $options: 'i' };
    if (cherche) filter.competence_recherchee = { $regex: cherche, $options: 'i' };
    if (competence && !offre && !cherche) {
      filter.$or = [
        { competence_offerte: { $regex: competence, $options: 'i' } },
        { competence_recherchee: { $regex: competence, $options: 'i' } },
      ];
    }

    const [skills, total] = await Promise.all([
      Skill.find(filter).populate('user_id', 'nom bio avatar').sort({ created_at: -1 }).skip(skip).limit(limit),
      Skill.countDocuments(filter),
    ]);

    res.json(req.paginate(total, skills));
  } catch (err) {
    next(err);
  }
};

// GET /api/skills/me
const getMySkills = async (req, res, next) => {
  const { limit, skip } = req.pagination;
  try {
    const [skills, total] = await Promise.all([
      Skill.find({ user_id: req.userId }).sort({ created_at: -1 }).skip(skip).limit(limit),
      Skill.countDocuments({ user_id: req.userId }),
    ]);
    res.json(req.paginate(total, skills));
  } catch (err) {
    next(err);
  }
};

const getSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id).populate('user_id', 'nom bio avatar');
    if (!skill) return res.status(404).json({ message: 'Annonce introuvable' });
    res.json(skill);
  } catch (err) {
    next(err);
  }
};

const updateSkill = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Annonce introuvable' });
    if (skill.user_id.toString() !== req.userId) return res.status(403).json({ message: 'Action non autorisée' });

    const { titre, description, competence_offerte, competence_recherchee } = req.body;
    Object.assign(skill, { titre, description, competence_offerte, competence_recherchee });
    await skill.save();
    res.json(skill);
  } catch (err) {
    next(err);
  }
};

const deleteSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Annonce introuvable' });
    if (skill.user_id.toString() !== req.userId) return res.status(403).json({ message: 'Action non autorisée' });

    await skill.deleteOne();
    logger.info(`Annonce supprimée : ${req.params.id}`);
    res.json({ message: 'Annonce supprimée avec succès' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/skills/:id/statut — basculer active <-> inactive
const toggleStatut = async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Annonce introuvable' });
    if (skill.user_id.toString() !== req.userId) return res.status(403).json({ message: 'Action non autorisée' });

    skill.statut = skill.statut === 'active' ? 'inactive' : 'active';
    await skill.save();
    logger.info(`Statut annonce ${req.params.id} -> ${skill.statut}`);
    res.json({ statut: skill.statut });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSkill, getAllSkills, getMySkills, getSkill, updateSkill, deleteSkill, toggleStatut };
