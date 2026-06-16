const Notification = require('../models/Notification.model');
const { safePaginationLimit, safePage } = require('../utils/sanitize');

// GET /api/v1/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { isRead, type, page, limit } = req.query;
    const safeLim = safePaginationLimit(limit, 50, 100);
    const safePg = safePage(page);
    const query = { adminId: req.user.id };

    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (type) {
      const types = type.split(',').map(t => t.trim());
      query.type = { $in: types };
    }

    const skip = (safePg - 1) * safeLim;
    const total = await Notification.countDocuments(query);

    const notifications = await Notification.find(query)
      .populate('member', 'fullName memberId phone photo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLim)
      .lean();

    res.json({
      success: true,
      data: notifications,
      pagination: { total, page: safePg, limit: safeLim, pages: Math.ceil(total / safeLim) },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user.id },
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
    await Notification.updateMany({ isRead: false, adminId: req.user.id }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/notifications/clear-all
const clearAll = async (req, res, next) => {
  try {
    await Notification.deleteMany({ adminId: req.user.id });
    res.json({ success: true, message: 'All notifications cleared.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/notifications/old
const deleteOldNotifications = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Notification.deleteMany({ createdAt: { $lt: thirtyDaysAgo }, adminId: req.user.id });
    res.json({ success: true, message: `Deleted ${result.deletedCount} old notifications.` });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/notifications/count
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ isRead: false, adminId: req.user.id });
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, markAllRead, clearAll, deleteOldNotifications, getUnreadCount };
