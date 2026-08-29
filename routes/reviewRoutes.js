const express = require('express');
const { createReview, getReviews } = require('../controllers/reviewController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, createReview);
router.get('/', getReviews); // Public with query params

module.exports = router;