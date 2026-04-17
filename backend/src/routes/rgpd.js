const express = require('express');
const router = express.Router();
const { exportData } = require('../controllers/rgpdController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: RGPD
 *   description: Conformité RGPD — export et suppression des données personnelles
 */

/**
 * @swagger
 * /rgpd/export:
 *   get:
 *     summary: Télécharger toutes ses données personnelles (RGPD)
 *     tags: [RGPD]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Exporte en JSON l'ensemble des données personnelles de l'utilisateur connecté :
 *       profil, annonces, demandes envoyées et reçues, messages, évaluations, favoris et notifications.
 *       Conformément au RGPD (article 20 — droit à la portabilité).
 *     responses:
 *       200:
 *         description: Export JSON des données personnelles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exportedAt:
 *                   type: string
 *                   format: date-time
 *                   example: '2026-04-14T13:00:00.000Z'
 *                 profil:
 *                   $ref: '#/components/schemas/User'
 *                 annonces:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Skill'
 *                 demandes_envoyees:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SkillRequest'
 *                 demandes_recues:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SkillRequest'
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 evaluations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Rating'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/export', authMiddleware, exportData);

module.exports = router;
