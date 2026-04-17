const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, logout, verifyEmail, refresh } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordResetController');
const authMiddleware = require('../middlewares/auth');
const { passwordRules } = require('../middlewares/passwordStrength');
const { authLimiter } = require('../middlewares/rateLimiter');

const registerRules = [
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  passwordRules('password'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
];

const forgotRules = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
];

const resetRules = [
  body('token').notEmpty().withMessage('Token requis'),
  passwordRules('password'),
];

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Inscription, connexion et gestion du compte
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Créer un nouveau compte
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, email, password]
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Alice Martin
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alice@efrei.net
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: motdepasse123
 *     responses:
 *       201:
 *         description: Compte créé, email de vérification envoyé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Compte créé. Vérifie ton email pour activer ton compte.
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', authLimiter, registerRules, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Se connecter et obtenir un token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alice@efrei.net
 *               password:
 *                 type: string
 *                 example: motdepasse123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Identifiants incorrects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authLimiter, loginRules, login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Se déconnecter (révoque le token JWT)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Déconnexion réussie
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', authMiddleware, logout);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Vérifier l'adresse email via le lien reçu
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de vérification reçu par email
 *     responses:
 *       200:
 *         description: Email vérifié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email vérifié avec succès
 *       400:
 *         description: Token invalide ou expiré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/verify-email', verifyEmail);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Demander un lien de réinitialisation du mot de passe
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alice@efrei.net
 *     responses:
 *       200:
 *         description: Email envoyé si le compte existe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Si ce compte existe, un email a été envoyé.
 *       400:
 *         description: Email invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/forgot-password', authLimiter, forgotRules, forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Réinitialiser le mot de passe avec le token reçu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *                 example: abc123def456
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: nouveaumotdepasse123
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Token invalide/expiré ou données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset-password', authLimiter, resetRules, resetPassword);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renouveler le JWT grâce au refresh token
 *     tags: [Auth]
 *     description: |
 *       Échange un refresh token valide contre un nouveau JWT (access token) et un nouveau refresh token.
 *       L'ancien refresh token est supprimé (rotation — un token ne peut être utilisé qu'une seule fois).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 example: a3f2b1c2d3e4f5a6b7c8d9e0f1a2b3c4...
 *     responses:
 *       200:
 *         description: Nouveau JWT et refresh token émis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refresh_token:
 *                   type: string
 *                   example: b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9...
 *       400:
 *         description: refresh_token manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Refresh token invalide ou expiré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh', authLimiter, [body('refresh_token').notEmpty().withMessage('refresh_token requis')], refresh);

module.exports = router;
