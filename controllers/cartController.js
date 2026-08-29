const { CartItem, Product, User, TraderProfile } = require('../models');

// controllers/cartController.js
exports.getCart = async (req, res) => {
  try {
    const items = await CartItem.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Product,
        include: [{
          model: User,
          as: 'trader',   // make sure this alias matches your association
          attributes: ['id', 'full_name', 'username'],
          include: [{ model: TraderProfile, attributes: ['shop_name'] }]
        }]
      }]
    });
    
    // Group by trader
    const grouped = items.reduce((acc, item) => {
      const trader = item.Product.trader;
      const traderId = trader ? trader.id : 'unknown';
      if (!acc[traderId]) {
        acc[traderId] = {
          trader: trader || { id: null, full_name: 'Unknown', TraderProfile: null },
          items: []
        };
      }
      acc[traderId].items.push(item);
      return acc;
    }, {});
    
    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    // Check product exists and is active
    const product = await Product.findOne({ where: { id: product_id, is_active: true } });
    if (!product) return res.status(404).json({ error: 'Product not available' });

    let cartItem = await CartItem.findOne({ where: { user_id: req.user.id, product_id } });
    if (cartItem) {
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({ user_id: req.user.id, product_id, quantity });
    }
    res.status(201).json(cartItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cartItem = await CartItem.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!cartItem) return res.status(404).json({ error: 'Item not found' });
    if (quantity <= 0) {
      await cartItem.destroy();
      return res.json({ message: 'Removed from cart' });
    }
    cartItem.quantity = quantity;
    await cartItem.save();
    res.json(cartItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const cartItem = await CartItem.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!cartItem) return res.status(404).json({ error: 'Item not found' });
    await cartItem.destroy();
    res.json({ message: 'Removed from cart' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await CartItem.destroy({ where: { user_id: req.user.id } });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};