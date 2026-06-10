const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { processQuery, getSuggestions } = require('../services/assistant.service');

router.use(verifyToken);

// POST /api/v1/assistant/query
router.post('/query', async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required.', code: 'NO_QUERY' });
    }

    const result = await processQuery(query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/assistant/suggestions
router.get('/suggestions', (req, res) => {
  res.json({ success: true, data: getSuggestions() });
});

module.exports = router;
