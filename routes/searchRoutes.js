const express = require('express');
const router = express.Router();
const { searchAll } = require('../controllers/searchController');

// Public search endpoint – no auth required
router.get('/', searchAll);

module.exports = router;