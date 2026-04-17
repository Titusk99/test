const Notification = require('../models/Notification');

const createNotification = async (user_id, type, message, ref_id = null) => {
  try {
    await Notification.create({ user_id, type, message, ref_id });
  } catch (err) {
    console.error('Erreur création notification :', err.message);
  }
};

// GET /api/notifications?page=1&limit=20
const getMyNotifications = async (req, res, next) => {
  const { limit, skip } = req.pagination;
  try {
    const [notifications, total, unread] = await Promise.all([
      Notification.find({ user_id: req.userId }).sort({ created_at: -1 }).skip(skip).limit(limit),
      Notification.countDocuments({ user_id: req.userId }),
      Notification.countDocuments({ user_id: req.userId, lu: false }),
    ]);

    res.json({ unread, ...req.paginate(total, notifications) });
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user_id: req.userId, lu: false }, { lu: true });
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (err) {
    next(err);
  }
};

const markOneAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.userId },
      { lu: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification introuvable' });
    res.json(notification);
  } catch (err) {
    next(err);
  }
};

module.exports = { createNotification, getMyNotifications, markAllAsRead, markOneAsRead };
