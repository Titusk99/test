const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');
const RefreshToken = require('../models/RefreshToken');
const mailer = require('../config/mailer');
const logger = require('../config/logger');

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRES_DAYS = 30;

// Génère un refresh token opaque (256 bits) et le persiste en base
const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(64).toString('hex');
  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  await RefreshToken.create({ user_id: userId, token, expires_at });
  return token;
};

const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { nom, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Cet email est déjà utilisé' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const email_verify_token = crypto.randomBytes(32).toString('hex');

    const user = await User.create({ nom, email, password_hash, email_verify_token });

    // Envoi email non-bloquant — l'inscription réussit même si le SMTP n'est pas configuré
    const verifyLink = `${process.env.CLIENT_URL}/verify-email?token=${email_verify_token}`;
    mailer.sendMail({
      from: `"SkillSwap" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: 'Confirme ton adresse email — SkillSwap',
      html: `
        <h2>Bienvenue sur SkillSwap, ${nom} ! 🎉</h2>
        <p>Clique sur le bouton ci-dessous pour confirmer ton adresse email :</p>
        <a href="${verifyLink}" style="background:#6366f1;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">
          Confirmer mon email
        </a>
        <p>Si tu n'as pas créé de compte, ignore cet email.</p>
      `,
    }).catch(err => logger.warn(`Email de vérification non envoyé à ${email} : ${err.message}`));

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    const refresh_token = await generateRefreshToken(user._id);

    logger.info(`Nouvel utilisateur inscrit : ${email}`);
    res.status(201).json({
      token,
      refresh_token,
      user: { id: user._id, nom: user.nom, email: user.email, email_verified: false },
      message: 'Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse.',
    });
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'Token manquant' });

  try {
    const user = await User.findOne({ email_verify_token: token });
    if (!user) return res.status(400).json({ message: 'Token invalide ou déjà utilisé' });

    user.email_verified = true;
    user.email_verify_token = null;
    await user.save();

    res.json({ message: 'Email vérifié avec succès !' });
  } catch (err) {
    next(err);
  }
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });

    // Vérifier si le compte est bloqué
    if (user.locked_until && user.locked_until > new Date()) {
      const remaining = Math.ceil((user.locked_until - new Date()) / 60000);
      logger.warn(`Tentative sur compte bloqué : ${email}`);
      return res.status(423).json({
        message: `Compte temporairement bloqué. Réessaie dans ${remaining} minute(s).`,
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      user.login_attempts += 1;
      if (user.login_attempts >= MAX_LOGIN_ATTEMPTS) {
        user.locked_until = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        user.login_attempts = 0;
        await user.save();
        logger.warn(`Compte bloqué après ${MAX_LOGIN_ATTEMPTS} tentatives : ${email}`);
        return res.status(423).json({
          message: `Trop de tentatives échouées. Compte bloqué ${LOCKOUT_DURATION_MINUTES} minutes.`,
        });
      }
      await user.save();
      logger.warn(`Tentative de connexion échouée (${user.login_attempts}/${MAX_LOGIN_ATTEMPTS}) : ${email}`);
      return res.status(401).json({
        message: `Email ou mot de passe incorrect (${user.login_attempts}/${MAX_LOGIN_ATTEMPTS} tentatives)`,
      });
    }

    // Connexion réussie — réinitialiser les compteurs
    user.login_attempts = 0;
    user.locked_until = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    const refresh_token = await generateRefreshToken(user._id);

    logger.info(`Connexion réussie : ${email}`);
    res.json({
      token,
      refresh_token,
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        email_verified: user.email_verified,
        avatar: user.avatar,
        competences_offertes: user.competences_offertes,
        competences_recherchees: user.competences_recherchees,
        bio: user.bio,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/refresh — échange un refresh token contre un nouveau JWT
const refresh = async (req, res, next) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ message: 'refresh_token requis' });

  try {
    const stored = await RefreshToken.findOne({ token: refresh_token }).populate('user_id');
    if (!stored) return res.status(401).json({ message: 'Refresh token invalide ou expiré' });

    if (stored.expires_at < new Date()) {
      await stored.deleteOne();
      return res.status(401).json({ message: 'Refresh token expiré, reconnecte-toi' });
    }

    // Rotation : supprime l'ancien, crée un nouveau
    const user = stored.user_id;
    await stored.deleteOne();

    const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    const newRefreshToken = await generateRefreshToken(user._id);

    logger.info(`Refresh token utilisé pour : ${user.email}`);
    res.json({ token: newToken, refresh_token: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

// Logout réel — blacklist le JWT + supprime le refresh token
const logout = async (req, res, next) => {
  try {
    await TokenBlacklist.create({
      token: req.token,
      expires_at: new Date(req.tokenExp * 1000),
    });

    // Supprime tous les refresh tokens de cet utilisateur
    await RefreshToken.deleteMany({ user_id: req.userId });

    logger.info(`Déconnexion utilisateur : ${req.userId}`);
    res.json({ message: 'Déconnexion réussie' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, verifyEmail, refresh };
