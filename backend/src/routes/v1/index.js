const router = require('express').Router();

const authRoutes        = require('../auth');
const userRoutes        = require('../users');
const skillRoutes       = require('../skills');
const requestRoutes     = require('../requests');
const matchRoutes       = require('../match');
const ratingRoutes      = require('../ratings');
const messageRoutes     = require('../messages');
const favoriteRoutes    = require('../favorites');
const notificationRoutes = require('../notifications');
const statsRoutes       = require('../stats');
const archiveRoutes     = require('../archive');
const rgpdRoutes        = require('../rgpd');

router.use('/auth',          authRoutes);
router.use('/users',         userRoutes);
router.use('/skills',        skillRoutes);
router.use('/requests',      requestRoutes);
router.use('/match',         matchRoutes);
router.use('/ratings',       ratingRoutes);
router.use('/messages',      messageRoutes);
router.use('/favorites',     favoriteRoutes);
router.use('/notifications', notificationRoutes);
router.use('/stats',         statsRoutes);
router.use('/archive',       archiveRoutes);
router.use('/rgpd',          rgpdRoutes);

module.exports = router;
