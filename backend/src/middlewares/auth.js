const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/TokenBlacklist');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant ou invalide' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Vérifier si le token est blacklisté (logout réel)
    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({ message: 'Token révoqué, veuillez vous reconnecter' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.token = token;
    req.tokenExp = decoded.exp;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token expiré ou invalide' });
  }
};

module.exports = authMiddleware;
