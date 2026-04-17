const Favorite = require('../models/Favorite');
const Skill = require('../models/Skill');

// POST /api/favorites — ajouter un favori
const addFavorite = async (req, res) => {
  const { skill_id } = req.body;

  if (!skill_id) return res.status(400).json({ message: 'skill_id requis' });

  try {
    const skill = await Skill.findById(skill_id);
    if (!skill) return res.status(404).json({ message: 'Annonce introuvable' });

    if (skill.user_id.toString() === req.userId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas mettre votre propre annonce en favori' });
    }

    const favorite = await Favorite.create({ user_id: req.userId, skill_id });
    res.status(201).json({ message: 'Ajouté aux favoris', favorite });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Cette annonce est déjà dans vos favoris' });
    }
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /api/favorites/:skill_id — retirer un favori
const removeFavorite = async (req, res) => {
  try {
    const result = await Favorite.findOneAndDelete({
      user_id: req.userId,
      skill_id: req.params.skill_id,
    });

    if (!result) return res.status(404).json({ message: 'Favori introuvable' });
    res.json({ message: 'Retiré des favoris' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/favorites — voir ses favoris
const getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user_id: req.userId })
      .populate({
        path: 'skill_id',
        populate: { path: 'user_id', select: 'nom bio avatar' },
      })
      .sort({ created_at: -1 });

    res.json(favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { addFavorite, removeFavorite, getMyFavorites };
