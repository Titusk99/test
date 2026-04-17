const express = require('express');
const router = express.Router();
const { getGlobalStats, getMyStats } = require('../controllers/statsController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Statistiques
 *   description: Statistiques globales et personnelles de la plateforme
 */

/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Statistiques globales de la plateforme
 *     tags: [Statistiques]
 *     description: Retourne le nombre total d'utilisateurs, d'annonces, d'échanges acceptés, la note moyenne et le top 5 des compétences les plus offertes.
 *     responses:
 *       200:
 *         description: Statistiques globales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 utilisateurs:
 *                   type: integer
 *                   example: 142
 *                 annonces:
 *                   type: integer
 *                   example: 87
 *                 echanges_acceptes:
 *                   type: integer
 *                   example: 34
 *                 note_moyenne:
 *                   type: number
 *                   format: float
 *                   example: 4.2
 *                 top_competences:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       competence:
 *                         type: string
 *                         example: React
 *                       count:
 *                         type: integer
 *                         example: 12
 */
router.get('/', getGlobalStats);

/**
 * @swagger
 * /stats/me:
 *   get:
 *     summary: Mes statistiques personnelles
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques de l'utilisateur connecté
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 annonces:
 *                   type: integer
 *                   example: 3
 *                 demandes_envoyees:
 *                   type: integer
 *                   example: 5
 *                 demandes_recues:
 *                   type: integer
 *                   example: 8
 *                 echanges_acceptes:
 *                   type: integer
 *                   example: 2
 *                 note_moyenne_recue:
 *                   type: number
 *                   format: float
 *                   example: 4.5
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authMiddleware, getMyStats);

module.exports = router;
