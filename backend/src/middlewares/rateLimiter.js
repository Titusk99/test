const rateLimit = require('express-rate-limit');

// Désactiver les rate limiters en dev et en test
const bypass = ['test', 'development'].includes(process.env.NODE_ENV);
const passThrough = (_req, _res, next) => next();

// Limiteur global : 100 requêtes par 15 minutes par IP
const globalLimiter = bypass ? passThrough : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de requêtes, veuillez réessayer dans 15 minutes' },
});

// Limiteur strict pour les routes auth : 10 tentatives par 15 minutes par IP
const authLimiter = bypass ? passThrough : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes' },
});

module.exports = { globalLimiter, authLimiter };
