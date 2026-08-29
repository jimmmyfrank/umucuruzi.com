const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 Token decoded:', decoded);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] }
    });
    if (!user) {
      console.log('❌ User not found for id:', decoded.id);
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.is_active) {
      console.log('❌ Account disabled for user:', user.id);
      return res.status(403).json({ error: 'Account disabled' });
    }

    console.log('✅ User authenticated:', user.id, user.role);
    req.user = user;
    next();
  } catch (err) {
    console.error('❌ Auth error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};