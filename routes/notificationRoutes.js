const express = require('express');
const router = express.Router();
const  authenticateToken  = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// All routes require authentication
router.get('/', authenticateToken, notificationController.getMyNotifications);
router.put('/:id/read', authenticateToken, notificationController.markRead);
router.put('/read-all', authenticateToken, notificationController.markAllRead);

module.exports = router;