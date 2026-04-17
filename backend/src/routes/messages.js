const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { sendMessage, getConversation } = require('../controllers/messageController');
const authMiddleware = require('../middlewares/auth');

const sendRules = [
  body('request_id').isMongoId().withMessage('ID échange invalide'),
  body('contenu').trim().notEmpty().withMessage('Le message ne peut pas être vide')
    .isLength({ max: 1000 }).withMessage('Message trop long (1000 caractères max)'),
];

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Messagerie interne entre participants d'un échange
 */

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Envoyer un message dans un échange accepté
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [request_id, contenu]
 *             properties:
 *               request_id:
 *                 type: string
 *                 description: ID de la demande d'échange (doit être acceptée)
 *                 example: 6618a3f2b1c2d3e4f5a6b7ca
 *               contenu:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Bonjour, je suis disponible ce weekend !
 *     responses:
 *       201:
 *         description: Message envoyé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
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
 *         description: Vous n'êtes pas participant à cet échange ou l'échange n'est pas accepté
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authMiddleware, sendRules, sendMessage);

/**
 * @swagger
 * /messages/{request_id}:
 *   get:
 *     summary: Récupérer la conversation d'un échange
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: request_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de la demande d'échange
 *     responses:
 *       200:
 *         description: Liste des messages de la conversation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
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
 *       403:
 *         description: Vous n'êtes pas participant à cet échange
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:request_id', authMiddleware, [param('request_id').isMongoId().withMessage('ID invalide')], getConversation);

module.exports = router;
