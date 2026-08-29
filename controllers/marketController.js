const { Market, MarketMembership, User, TraderProfile, Product, Category } = require('../models');
const { Op } = require('sequelize');

exports.getAllMarkets = async (req, res) => {
  try {
    const markets = await Market.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
    res.json(markets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
exports.getMarketById = async (req, res) => {
  try {
    const market = await Market.findOne({
      where: { id: req.params.id, is_active: true },
      include: [{
        model: MarketMembership,
        required: false,
        where: { is_active: true },
        include: [{
          model: User,   // ✅ no alias – default association name
          attributes: ['id', 'full_name', 'username', 'profile_image', 'is_active'],
          include: [
            { model: TraderProfile, attributes: ['shop_name', 'description'] },
            {
              model: Product,
              where: { is_active: true },
              required: false,
              include: [{ model: Category }]
            }
          ]
        }]
      }]
    });
    if (!market) return res.status(404).json({ error: 'Market not found' });
    res.json(market);
  } catch (err) {
    console.error('Error in getMarketById:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get markets the logged-in trader is a member of
exports.getMyMarkets = async (req, res) => {
  try {
    const memberships = await MarketMembership.findAll({
      where: { trader_id: req.user.id },
      include: [{ model: Market, where: { is_active: true } }],
      order: [['joined_at', 'DESC']]
    });
    res.json(memberships);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createMarket = async (req, res) => {
  try {
    const { name, district, sector, cell, village, coordinates, description, days_active } = req.body;
    const market = await Market.create({
      name,
      district,
      sector,
      cell,
      village,
      coordinates,
      description,
      days_active: days_active || [],
      created_by: req.user.id
    });
    res.status(201).json(market);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMarket = async (req, res) => {
  try {
    const market = await Market.findOne({ where: { id: req.params.id } });
    if (!market) return res.status(404).json({ error: 'Market not found' });
    // Only creator or admin can update
    if (market.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await market.update(req.body);
    res.json(market);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.joinMarket = async (req, res) => {
  try {
    const marketId = req.params.id;
    const traderId = req.user.id;
    // Check if already joined
    const existing = await MarketMembership.findOne({ where: { market_id: marketId, trader_id: traderId } });
    if (existing) {
      if (!existing.is_active) {
        await existing.update({ is_active: true });
        return res.json({ message: 'Rejoined market' });
      }
      return res.status(400).json({ error: 'Already joined' });
    }
    const membership = await MarketMembership.create({
      market_id: marketId,
      trader_id: traderId,
      is_active: true
    });
    res.status(201).json(membership);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.leaveMarket = async (req, res) => {
  try {
    console.log('🔍 Leave market with membership ID:', req.params.id);
    const membership = await MarketMembership.findOne({
      where: { id: req.params.id, trader_id: req.user.id }
    });
    if (!membership) {
      console.log('❌ Membership not found');
      return res.status(404).json({ error: 'Membership not found' });
    }
    await membership.update({ is_active: false });
    console.log('✅ Membership deactivated');
    res.json({ message: 'Left market' });
  } catch (err) {
    console.error('❌ LeaveMarket error:', err);
    res.status(500).json({ error: err.message });
  }
};