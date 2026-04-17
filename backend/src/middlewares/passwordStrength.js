const { body } = require('express-validator');

/**
 * Règles de complexité du mot de passe :
 * - 8 caractères minimum
 * - Au moins une majuscule
 * - Au moins une minuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial
 */
const passwordRules = (field = 'password') =>
  body(field)
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[A-Z]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule')
    .matches(/[a-z]/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule')
    .matches(/[0-9]/)
    .withMessage('Le mot de passe doit contenir au moins un chiffre')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Le mot de passe doit contenir au moins un caractère spécial (!, @, #, ...)');

module.exports = { passwordRules };
