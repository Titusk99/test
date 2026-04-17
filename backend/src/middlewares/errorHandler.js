const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  // Log de l'erreur
  logger.error(`${err.message}`, { stack: err.stack, path: req.path, method: req.method });

  // Erreur Mongoose — document non trouvé
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'ID invalide' });
  }

  // Erreur Mongoose — champ unique dupliqué
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `Ce ${field} est déjà utilisé` });
  }

  // Erreur Mongoose — validation
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Token invalide' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expiré' });
  }

  // Erreur Multer (upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Fichier trop volumineux (2Mo max)' });
  }

  // Erreur générique
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : err.message,
  });
};

module.exports = errorHandler;
