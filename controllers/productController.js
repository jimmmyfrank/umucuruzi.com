const { Product, Category, User, TraderProfile, Review } = require('../models');
const { Op } = require('sequelize');

exports.getAllProducts = async (req, res) => {
  try {
    const { category, trader, search, limit = 20, offset = 0 } = req.query;
    const where = { is_active: true };
    if (category) where.category_id = category;
    if (trader) where.trader_id = trader;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    const products = await Product.findAndCountAll({
      where,
      include: [
        { model: Category },
        {
          model: User,
          as: 'trader',
          attributes: ['id', 'full_name', 'username', 'phone'],
          include: [{ model: TraderProfile, attributes: ['shop_name', 'district', 'sector'] }]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    res.json({
      products: products.rows,
      total: products.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, is_active: true },
      include: [
        { model: Category },
        {
          model: User,
          as: 'trader',
          attributes: ['id', 'full_name', 'username', 'phone'],
          include: [{ model: TraderProfile, attributes: ['shop_name', 'district', 'sector', 'description', 'coordinates'] }]
        },
        {
          model: Review,
          as: 'Reviews',   // ✅ correct alias – matches the association
          attributes: ['rating', 'comment', 'created_at'],
          include: [{ model: User, as: 'customer', attributes: ['full_name'] }]
        }
      ]
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const reviews = product.Reviews || [];
    const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0;
    res.json({ ...product.toJSON(), avgRating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getProductsByTrader = async (req, res) => {
  try {
    const traderId = req.params.traderId;
    const products = await Product.findAll({
      where: { trader_id: traderId, is_active: true },
      include: [Category]
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




exports.getProductsByTrader = async (req, res) => {
  try {
    const traderId = req.params.traderId;
    const products = await Product.findAll({
      where: { trader_id: traderId, is_active: true },
      include: [Category]
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



