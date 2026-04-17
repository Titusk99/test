const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const mailer = require('../config/mailer');

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    // Réponse identique que l'email existe ou non (sécurité anti-enumération)
    if (!user) {
      return res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé' });
    }

    // Invalider les anciens tokens
    await PasswordReset.deleteMany({ user_id: user._id });

    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await PasswordReset.create({ user_id: user._id, token, expires_at });

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    // Envoi email non-bloquant
    mailer.sendMail({
      from: `"SkillSwap" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: 'Réinitialisation de ton mot de passe — SkillSwap',
      html: `
        <h2>Réinitialisation de mot de passe</h2>
        <p>Bonjour ${user.nom},</p>
        <p>Clique sur le lien ci-dessous pour réinitialiser ton mot de passe :</p>
        <a href="${resetLink}" style="background:#6366f1;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">
          Réinitialiser mon mot de passe
        </a>
        <p>Ce lien expire dans <strong>1 heure</strong>.</p>
        <p>Si tu n'as pas demandé cette réinitialisation, ignore cet email.</p>
      `,
    }).catch(err => console.warn(`Email reset non envoyé : ${err.message}`));

    res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { token, password } = req.body;

  try {
    const resetEntry = await PasswordReset.findOne({ token, used: false });

    if (!resetEntry) {
      return res.status(400).json({ message: 'Token invalide ou déjà utilisé' });
    }

    if (resetEntry.expires_at < new Date()) {
      return res.status(400).json({ message: 'Token expiré, fais une nouvelle demande' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(resetEntry.user_id, { password_hash });

    resetEntry.used = true;
    await resetEntry.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { forgotPassword, resetPassword };
