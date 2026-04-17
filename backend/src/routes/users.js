const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { getUser, updateUser, deleteUser, uploadAvatar } = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const updateRules = [
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
  body('bio').optional().trim(),
  body('competences_offertes').optional().trim(),
  body('competences_recherchees').optional().trim(),
];

const idRule = [
  param('id').isMongoId().withMessage('ID invalide'),
];

/**
 * @swagger
 * tags:
 *   name: Utilisateurs
 *   description: Gestion des profils utilisateurs
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Récupérer le profil d'un utilisateur
 *     tags: [Utilisateurs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de l'utilisateur
 *     responses:
 *       200:
 *         description: Profil de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: ID invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', idRule, getUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Mettre à jour son profil
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de l'utilisateur (doit correspondre à l'utilisateur connecté)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom]
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Alice Martin
 *               bio:
 *                 type: string
 *                 example: Passionnée de dev web
 *               competences_offertes:
 *                 type: string
 *                 example: React, Node.js
 *               competences_recherchees:
 *                 type: string
 *                 example: Python, Data Science
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Action non autorisée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authMiddleware, [...idRule, ...updateRules], updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Supprimer son compte
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de l'utilisateur (doit correspondre à l'utilisateur connecté)
 *     responses:
 *       200:
 *         description: Compte supprimé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Compte supprimé avec succès
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Action non autorisée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authMiddleware, idRule, deleteUser);

/**
 * @swagger
 * /users/{id}/avatar:
 *   post:
 *     summary: Uploader ou remplacer son avatar
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Image JPG, PNG ou WEBP (max 2 Mo)
 *     responses:
 *       200:
 *         description: Avatar mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatar:
 *                   type: string
 *                   example: http://localhost:3000/uploads/avatars/abc123.jpg
 *       400:
 *         description: Aucun fichier reçu ou format invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Action non autorisée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/avatar', authMiddleware, idRule, upload.single('avatar'), uploadAvatar);

module.exports = router;
