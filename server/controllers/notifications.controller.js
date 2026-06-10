const Notification = require('../models/Notification.model');

// GET /api/v1/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { isRead, type, page = 1, limit = 50 } = req.query;
    const query = {};

    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Notification.countDocuments(query);

    const notifications = await Notification.find(query)
      .populate('member', 'fullName memberId phone photo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: notifications,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found.', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/notifications/old
const deleteOldNotifications = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Notification.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
    res.json({ success: true, message: `Deleted ${result.deletedCount} old notifications.` });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/notifications/count
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ isRead: false });
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, markAllRead, deleteOldNotifications, getUnreadCount };
