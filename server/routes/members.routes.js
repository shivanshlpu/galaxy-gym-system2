const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const {
  getMembers,
  createMember,
  getMember,
  updateMember,
  deleteMember,
  uploadPhoto,
  getMemberStats,
  getExpiringMembers,
  getInactiveMembers,
  renewMember,
} = require('../controllers/members.controller');

// All routes require authentication
router.use(verifyToken);

// Stats routes (must be before /:id to avoid matching)
router.get('/stats/summary', getMemberStats);
router.get('/expiring', getExpiringMembers);
router.get('/inactive', getInactiveMembers);

// CRUD
router.get('/', getMembers);
router.post('/', createMember);
router.get('/:id', getMember);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);
router.post('/:id/photo', upload.single('photo'), uploadPhoto);
router.post('/:id/renew', renewMember);

module.exports = router;
