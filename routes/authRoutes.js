const express = require('express');
const { signup, login, googleAuth, generateTraderQR } = require('../controllers/authController');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/qr/:traderId', generateTraderQR);

module.exports = router;