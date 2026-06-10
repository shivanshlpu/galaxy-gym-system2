const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getNotifications, markAsRead, markAllRead, deleteOldNotifications, getUnreadCount } = require('../controllers/notifications.controller');

router.use(verifyToken);

router.get('/count', getUnreadCount);
router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markAsRead);
router.delete('/old', deleteOldNotifications);

module.exports = router;
