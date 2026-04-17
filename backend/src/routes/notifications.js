const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const { getMyNotifications, markAllAsRead, markOneAsRead } = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notifications en temps réel (nouvelles demandes, messages, acceptations)
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Récupérer mes notifications (avec pagination)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Liste paginée des notifications
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Pagination'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [new_request, request_accepted, request_refused, new_message]
 *                             example: new_request
 *                           contenu:
 *                             type: string
 *                             example: Alice Martin vous a envoyé une demande d'échange
 *                           lu:
 *                             type: boolean
 *                             example: false
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authMiddleware, getMyNotifications);

/**
 * @swagger
 * /notifications/read:
 *   put:
 *     summary: Marquer toutes les notifications comme lues
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Toutes les notifications marquées comme lues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Toutes les notifications sont marquées comme lues
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/read', authMiddleware, markAllAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Marquer une notification spécifique comme lue
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de la notification
 *     responses:
 *       200:
 *         description: Notification marquée comme lue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification marquée comme lue
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
 *         description: Notification introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/read', authMiddleware, [param('id').isMongoId().withMessage('ID invalide')], markOneAsRead);

module.exports = router;
