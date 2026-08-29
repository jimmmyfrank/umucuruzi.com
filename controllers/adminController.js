const { Market, Category, User, Advertisement, AppSetting, Order, Product, TraderProfile } = require('../models');
const { Op } = require('sequelize');


const bcrypt = require('bcryptjs');  // <-- ADD THIS LINE

const { signToken } = require('../utils/jwt'); // Make sure this is also imported!



// --- MARKET CRUD ---
exports.createMarket = async (req, res) => {
  try {
    const market = await Market.create(req.body); // expects name, district, sector, cell, village, days_active, created_by (admin ID)
    res.status(201).json(market);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.getAllMarkets = async (req, res) => {
  try {
    const markets = await Market.findAll();
    res.json(markets);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.updateMarket = async (req, res) => {
  try {
    const market = await Market.findByPk(req.params.id);
    if (!market) return res.status(404).json({ error: 'Market not found' });
    await market.update(req.body);
    res.json(market);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.deleteMarket = async (req, res) => {
  try {
    const market = await Market.findByPk(req.params.id);
    if (!market) return res.status(404).json({ error: 'Market not found' });
    await market.destroy();
    res.json({ message: 'Market deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- CATEGORY CRUD ---
exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.updateCategory = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    await cat.update(req.body);
    res.json(cat);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.deleteCategory = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    await cat.destroy();
    res.json({ message: 'Category deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
// User management
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      include: [{ model: TraderProfile, required: false }]
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.is_active = !user.is_active;
    await user.save();
    res.json({ message: `User ${user.is_active ? 'activated' : 'deactivated'}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Advertisements
exports.createAd = async (req, res) => {
  try {
    const ad = await Advertisement.create(req.body);
    res.status(201).json(ad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAds = async (req, res) => {
  try {
    const ads = await Advertisement.findAll();
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAd = async (req, res) => {
  try {
    const ad = await Advertisement.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    await ad.update(req.body);
    res.json(ad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAd = async (req, res) => {
  try {
    const ad = await Advertisement.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    await ad.destroy();
    res.json({ message: 'Ad deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// App Settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await AppSetting.findAll();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    const setting = await AppSetting.findOne({ where: { setting_key: key } });
    if (setting) {
      await setting.update({ setting_value: value });
    } else {
      await AppSetting.create({ setting_key: key, setting_value: value });
    }
    res.json({ message: 'Setting updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Dashboard stats
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalTraders = await User.count({ where: { role: 'trader' } });
    const totalOrders = await Order.count();
    const totalProducts = await Product.count();
    const totalMarkets = await Market.count();
    res.json({
      totalUsers,
      totalTraders,
      totalOrders,
      totalProducts,
      totalMarkets
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};