const { Review, Product, User, TraderProfile } = require('../models');

exports.createReview = async (req, res) => {
  try {
    const { target_type, target_id, rating, comment } = req.body;
    // Check target exists
    if (target_type === 'product') {
      const product = await Product.findByPk(target_id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
    } else if (target_type === 'trader') {
      const trader = await User.findOne({ where: { id: target_id, role: 'trader' } });
      if (!trader) return res.status(404).json({ error: 'Trader not found' });
    } else {
      return res.status(400).json({ error: 'Invalid target_type' });
    }

    // Check if user already reviewed this target
    const existing = await Review.findOne({
      where: { customer_id: req.user.id, target_type, target_id }
    });
    if (existing) {
      // Update instead
      await existing.update({ rating, comment });
      return res.json(existing);
    }

    const review = await Review.create({
      customer_id: req.user.id,
      target_type,
      target_id,
      rating,
      comment
    });
    // Update trader's average rating if target is trader
    if (target_type === 'trader') {
      const reviews = await Review.findAll({ where: { target_type: 'trader', target_id } });
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await TraderProfile.update({ rating_avg: avg }, { where: { user_id: target_id } });
    }
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { target_type, target_id } = req.query;
    if (!target_type || !target_id) {
      return res.status(400).json({ error: 'target_type and target_id required' });
    }
    const reviews = await Review.findAll({
      where: { target_type, target_id },
      include: [{ model: User, as: 'customer', attributes: ['id', 'full_name'] }],
      order: [['created_at', 'DESC']]
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};