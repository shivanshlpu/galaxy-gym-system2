const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getSettings, updateSettings } = require('../controllers/settings.controller');

router.use(verifyToken);

router.get('/', getSettings);
// Settings accepts base64 poster images — needs larger body limit than the global 1MB
router.put('/', express.json({ limit: '10mb' }), updateSettings);

module.exports = router;
