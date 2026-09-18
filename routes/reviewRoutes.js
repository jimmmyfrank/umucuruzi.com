const express = require('express');
const { createReview, getReviews,
      createTraderReview,
  getTraderReviews,
  deleteTraderReview,
 } = require('../controllers/reviewController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, createReview);
router.get('/', getReviews);
 // Public with query params
 router.get('/trader/:traderId', getTraderReviews);
router.post('/trader/:traderId', auth, createTraderReview);
router.delete('/trader/:id', auth, deleteTraderReview);


module.exports = router;
