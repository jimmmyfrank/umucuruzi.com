const { Product, User, TraderProfile, Market, Category } = require('../models');
const { Op } = require('sequelize');

exports.searchAll = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ products: [], traders: [], markets: [], total: 0 });
    }

    const searchTerm = q.trim();
    const like = `%${searchTerm}%`;

    // ─── Products ──────────────────────────────────────────────────
    const products = await Product.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { name: { [Op.like]: like } },
          { description: { [Op.like]: like } }
        ]
      },
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: User, as: 'trader', attributes: ['id', 'full_name', 'username'] }
      ],
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    // ─── Traders ──────────────────────────────────────────────────
    const traders = await User.findAll({
      where: {
        role: 'trader',
        is_active: true,
        [Op.or]: [
          { full_name: { [Op.like]: like } },
          { username: { [Op.like]: like } },
          { '$TraderProfile.shop_name$': { [Op.like]: like } },
          { '$TraderProfile.district$': { [Op.like]: like } },
          { '$TraderProfile.sector$': { [Op.like]: like } }
        ]
      },
      include: [{ model: TraderProfile }],
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    // ─── Markets ──────────────────────────────────────────────────
    const markets = await Market.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { name: { [Op.like]: like } },
          { description: { [Op.like]: like } },
          { district: { [Op.like]: like } },
          { sector: { [Op.like]: like } },
          { cell: { [Op.like]: like } },
          { village: { [Op.like]: like } }
        ]
      },
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    res.json({
      products,
      traders,
      markets,
      total: products.length + traders.length + markets.length
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
};