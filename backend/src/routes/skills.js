const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { createSkill, getAllSkills, getMySkills, getSkill, updateSkill, deleteSkill, toggleStatut } = require('../controllers/skillController');
const authMiddleware = require('../middlewares/auth');

const skillRules = [
  body('titre').trim().notEmpty().withMessage('Le titre est requis'),
  body('description').trim().notEmpty().withMessage('La description est requise'),
  body('competence_offerte').trim().notEmpty().withMessage('La compétence offerte est requise'),
  body('competence_recherchee').trim().notEmpty().withMessage('La compétence recherchée est requise'),
];

const idRule = [
  param('id').isMongoId().withMessage('ID invalide'),
];

/**
 * @swagger
 * tags:
 *   name: Annonces
 *   description: Annonces d'échange de compétences
 */

/**
 * @swagger
 * /skills/me:
 *   get:
 *     summary: Récupérer mes annonces
 *     tags: [Annonces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de mes annonces
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
// /me doit être déclaré AVANT /:id pour ne pas être capturé par le paramètre
router.get('/me', authMiddleware, getMySkills);

/**
 * @swagger
 * /skills:
 *   get:
 *     summary: Lister toutes les annonces (avec pagination)
 *     tags: [Annonces]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Nombre de résultats par page
 *     responses:
 *       200:
 *         description: Liste paginée des annonces
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
 *                         $ref: '#/components/schemas/Skill'
 */
router.get('/', getAllSkills);

/**
 * @swagger
 * /skills/{id}:
 *   get:
 *     summary: Récupérer une annonce par son ID
 *     tags: [Annonces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de l'annonce
 *     responses:
 *       200:
 *         description: Détails de l'annonce
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
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
router.get('/:id', idRule, getSkill);

/**
 * @swagger
 * /skills:
 *   post:
 *     summary: Créer une nouvelle annonce
 *     tags: [Annonces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titre, description, competence_offerte, competence_recherchee]
 *             properties:
 *               titre:
 *                 type: string
 *                 example: J'apprends React, tu m'apprends Python
 *               description:
 *                 type: string
 *                 example: Échange de 2h/semaine en visio
 *               competence_offerte:
 *                 type: string
 *                 example: React, Node.js
 *               competence_recherchee:
 *                 type: string
 *                 example: Python, Data Science
 *     responses:
 *       201:
 *         description: Annonce créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
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
 */
router.post('/', authMiddleware, skillRules, createSkill);

/**
 * @swagger
 * /skills/{id}:
 *   put:
 *     summary: Modifier une annonce
 *     tags: [Annonces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de l'annonce
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titre, description, competence_offerte, competence_recherchee]
 *             properties:
 *               titre:
 *                 type: string
 *                 example: J'apprends React, tu m'apprends Python
 *               description:
 *                 type: string
 *                 example: Échange de 2h/semaine en visio
 *               competence_offerte:
 *                 type: string
 *                 example: React, Node.js
 *               competence_recherchee:
 *                 type: string
 *                 example: Python, Data Science
 *     responses:
 *       200:
 *         description: Annonce mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
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
 *         description: Annonce introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authMiddleware, [...idRule, ...skillRules], updateSkill);

/**
 * @swagger
 * /skills/{id}:
 *   delete:
 *     summary: Supprimer une annonce
 *     tags: [Annonces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de l'annonce
 *     responses:
 *       200:
 *         description: Annonce supprimée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Annonce supprimée
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
 *         description: Annonce introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authMiddleware, idRule, deleteSkill);

/**
 * @swagger
 * /skills/{id}/statut:
 *   patch:
 *     summary: Basculer le statut d'une annonce (active/inactive)
 *     tags: [Annonces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Action non autorisée
 *       404:
 *         description: Annonce introuvable
 */
router.patch('/:id/statut', authMiddleware, idRule, toggleStatut);

module.exports = router;
