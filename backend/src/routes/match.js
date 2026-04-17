const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const { getMyMatches, searchSkills, getMatchesForSkill } = require('../controllers/matchController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Matching
 *   description: Moteur de matching automatique et recherche de compétences
 */

/**
 * @swagger
 * /match:
 *   get:
 *     summary: Obtenir les profils qui matchent automatiquement avec le mien
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Retourne les annonces dont la `competence_offerte` correspond à mes `competences_recherchees`
 *       et dont la `competence_recherchee` correspond à mes `competences_offertes`. Le score de
 *       correspondance est calculé automatiquement.
 *     responses:
 *       200:
 *         description: Liste des annonces qui matchent, triées par score décroissant
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Skill'
 *                   - type: object
 *                     properties:
 *                       score:
 *                         type: integer
 *                         description: Score de correspondance (1 ou 2)
 *                         example: 2
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authMiddleware, getMyMatches);

/**
 * @swagger
 * /match/search:
 *   get:
 *     summary: Rechercher des annonces par mot-clé
 *     tags: [Matching]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Mot-clé à rechercher dans les titres, descriptions et compétences
 *         example: React
 *     responses:
 *       200:
 *         description: Résultats de la recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Skill'
 *       400:
 *         description: Paramètre de recherche manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search', searchSkills);

/**
 * @swagger
 * /match/skill/{id}:
 *   get:
 *     summary: Trouver les annonces compatibles avec une annonce donnée
 *     tags: [Matching]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de l'annonce de référence
 *     responses:
 *       200:
 *         description: Annonces compatibles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Skill'
 *       400:
 *         description: ID invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Annonce introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/skill/:id', [param('id').isMongoId().withMessage('ID invalide')], getMatchesForSkill);

module.exports = router;
