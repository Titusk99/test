const express = require('express');
const router = express.Router();
const { param, body } = require('express-validator');
const { addFavorite, removeFavorite, getMyFavorites } = require('../controllers/favoriteController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Favoris
 *   description: Gestion des annonces sauvegardées
 */

/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Récupérer mes annonces favorites
 *     tags: [Favoris]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de mes favoris
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Skill'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authMiddleware, getMyFavorites);

/**
 * @swagger
 * /favorites:
 *   post:
 *     summary: Ajouter une annonce en favori
 *     tags: [Favoris]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [skill_id]
 *             properties:
 *               skill_id:
 *                 type: string
 *                 description: ID MongoDB de l'annonce à sauvegarder
 *                 example: 6618a3f2b1c2d3e4f5a6b7c9
 *     responses:
 *       201:
 *         description: Annonce ajoutée aux favoris
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ajouté aux favoris
 *       400:
 *         description: Données invalides ou déjà en favori
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
 */
router.post('/', authMiddleware, [body('skill_id').isMongoId().withMessage('ID invalide')], addFavorite);

/**
 * @swagger
 * /favorites/{skill_id}:
 *   delete:
 *     summary: Retirer une annonce des favoris
 *     tags: [Favoris]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skill_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de l'annonce à retirer
 *     responses:
 *       200:
 *         description: Annonce retirée des favoris
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Retiré des favoris
 *       400:
 *         description: ID invalide
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
 *       404:
 *         description: Favori introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:skill_id', authMiddleware, [param('skill_id').isMongoId().withMessage('ID invalide')], removeFavorite);

module.exports = router;
