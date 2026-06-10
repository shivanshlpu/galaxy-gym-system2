const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getSettings, updateSettings } = require('../controllers/settings.controller');

router.use(verifyToken);

router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
