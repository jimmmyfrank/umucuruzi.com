const express = require('express');
const { getAllProducts, getProductById, getProductsByTrader } = require('../controllers/productController');
const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.get('/trader/:traderId', getProductsByTrader);

module.exports = router;