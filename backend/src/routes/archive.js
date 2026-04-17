const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const { archiveRequest, getArchivedRequests, deleteArchivedRequest } = require('../controllers/archiveController');
const authMiddleware = require('../middlewares/auth');

const requestIdRule = [param('request_id').isMongoId().withMessage('ID invalide')];

/**
 * @swagger
 * tags:
 *   name: Archivage
 *   description: Archivage et gestion des échanges terminés
 */

/**
 * @swagger
 * /archive:
 *   get:
 *     summary: Récupérer mes échanges archivés
 *     tags: [Archivage]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des demandes archivées
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SkillRequest'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authMiddleware, getArchivedRequests);

/**
 * @swagger
 * /archive/{request_id}:
 *   put:
 *     summary: Archiver un échange accepté
 *     tags: [Archivage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: request_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de la demande d'échange à archiver
 *     responses:
 *       200:
 *         description: Échange archivé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SkillRequest'
 *       400:
 *         description: ID invalide ou échange non éligible à l'archivage
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
 *         description: Échange introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:request_id', authMiddleware, requestIdRule, archiveRequest);

/**
 * @swagger
 * /archive/{request_id}:
 *   delete:
 *     summary: Supprimer définitivement un échange archivé
 *     tags: [Archivage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: request_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de l'échange archivé à supprimer
 *     responses:
 *       200:
 *         description: Échange supprimé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Échange supprimé définitivement
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
 *         description: Échange introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:request_id', authMiddleware, requestIdRule, deleteArchivedRequest);

module.exports = router;
