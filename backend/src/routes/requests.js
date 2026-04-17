const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { sendRequest, getMyRequests, updateRequest } = require('../controllers/requestController');
const authMiddleware = require('../middlewares/auth');

const sendRules = [
  body('receiver_id').isMongoId().withMessage('ID destinataire invalide'),
  body('skill_id').isMongoId().withMessage('ID annonce invalide'),
  body('message').optional().trim().isLength({ max: 500 }).withMessage('Message trop long (500 caractères max)'),
];

const updateRules = [
  param('id').isMongoId().withMessage('ID invalide'),
  body('statut')
    .isIn(['accepted', 'refused'])
    .withMessage('Statut invalide, valeurs acceptées : accepted, refused'),
];

/**
 * @swagger
 * tags:
 *   name: Demandes
 *   description: Demandes d'échange entre étudiants
 */

/**
 * @swagger
 * /requests:
 *   get:
 *     summary: Voir mes demandes (envoyées et reçues)
 *     tags: [Demandes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des demandes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sent:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SkillRequest'
 *                 received:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SkillRequest'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authMiddleware, getMyRequests);

/**
 * @swagger
 * /requests:
 *   post:
 *     summary: Envoyer une demande d'échange
 *     tags: [Demandes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiver_id, skill_id]
 *             properties:
 *               receiver_id:
 *                 type: string
 *                 description: ID MongoDB du destinataire
 *                 example: 6618a3f2b1c2d3e4f5a6b7c8
 *               skill_id:
 *                 type: string
 *                 description: ID MongoDB de l'annonce ciblée
 *                 example: 6618a3f2b1c2d3e4f5a6b7c9
 *               message:
 *                 type: string
 *                 maxLength: 500
 *                 example: Bonjour, je suis intéressé par ton annonce !
 *     responses:
 *       201:
 *         description: Demande envoyée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SkillRequest'
 *       400:
 *         description: Données invalides ou demande déjà existante
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
router.post('/', authMiddleware, sendRules, sendRequest);

/**
 * @swagger
 * /requests/{id}:
 *   put:
 *     summary: Accepter ou refuser une demande reçue
 *     tags: [Demandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de la demande
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [statut]
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [accepted, refused]
 *                 example: accepted
 *     responses:
 *       200:
 *         description: Demande mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SkillRequest'
 *       400:
 *         description: Statut invalide
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
 *         description: Demande introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authMiddleware, updateRules, updateRequest);

module.exports = router;
