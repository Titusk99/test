const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { createRating, getUserRatings } = require('../controllers/ratingController');
const authMiddleware = require('../middlewares/auth');

const ratingRules = [
  body('request_id').isMongoId().withMessage('ID de demande invalide'),
  body('note').isInt({ min: 1, max: 5 }).withMessage('La note doit être entre 1 et 5'),
  body('commentaire').optional().trim().isLength({ max: 500 }).withMessage('Commentaire trop long'),
];

/**
 * @swagger
 * tags:
 *   name: Évaluations
 *   description: Notation et commentaires après un échange
 */

/**
 * @swagger
 * /ratings:
 *   post:
 *     summary: Laisser une évaluation après un échange accepté
 *     tags: [Évaluations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [request_id, note]
 *             properties:
 *               request_id:
 *                 type: string
 *                 description: ID de la demande d'échange acceptée
 *                 example: 6618a3f2b1c2d3e4f5a6b7ca
 *               note:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               commentaire:
 *                 type: string
 *                 maxLength: 500
 *                 example: Super échange, très pédagogue !
 *     responses:
 *       201:
 *         description: Évaluation enregistrée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rating'
 *       400:
 *         description: Données invalides ou évaluation déjà soumise
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
 *         description: Échange non accepté ou vous n'êtes pas participant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authMiddleware, ratingRules, createRating);

/**
 * @swagger
 * /ratings/user/{id}:
 *   get:
 *     summary: Récupérer toutes les évaluations reçues par un utilisateur
 *     tags: [Évaluations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de l'utilisateur évalué
 *     responses:
 *       200:
 *         description: Liste des évaluations et note moyenne
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 moyenne:
 *                   type: number
 *                   format: float
 *                   example: 4.3
 *                 total:
 *                   type: integer
 *                   example: 7
 *                 ratings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Rating'
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
router.get('/user/:id', [param('id').isMongoId().withMessage('ID invalide')], getUserRatings);

module.exports = router;
