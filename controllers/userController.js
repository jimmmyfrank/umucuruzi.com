const { User, TraderProfile, Loyalty, Order, ReferralReward, Notification } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');



exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: TraderProfile,
        required: false
      }]
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getTraders = async (req, res) => {
  try {
    const traders = await User.findAll({
      where: { role: 'trader', is_active: true },
      attributes: ['id', 'full_name', 'username', 'phone', 'profile_image'],
      include: [{ model: TraderProfile, attributes: ['shop_name', 'district', 'sector'] }]
    });
    res.json(traders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { password, role, profile_image, ...rest } = req.body;

    // ── Separate fields for User and TraderProfile ──
    const userFields = ['full_name', 'username', 'email', 'phone', 'description'];
    const traderFields = [
      'shop_name', 'district', 'sector', 'cell', 'village',
      'coordinates', 'description', 'business_category',
      'payment_code', 'payment_phone'
    ];

    // Build user update object
    const userUpdateData = {};
    userFields.forEach(field => {
      if (rest[field] !== undefined) userUpdateData[field] = rest[field];
    });

    // Handle profile image (base64)
    let profileImagePath = user.profile_image;
    if (profile_image) {
      try {
        let base64String = profile_image;
        let fileExtension = 'jpg';

        if (profile_image.startsWith('data:image')) {
          const matches = profile_image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            fileExtension = matches[1];
            base64String = matches[2];
          } else {
            const parts = profile_image.split(',');
            if (parts.length === 2) {
              const mimeMatch = parts[0].match(/^data:image\/([a-zA-Z]+);base64$/);
              if (mimeMatch) fileExtension = mimeMatch[1];
              base64String = parts[1];
            }
          }
        }

        const buffer = Buffer.from(base64String, 'base64');
        if (buffer.length > 30 * 1024 * 1024) {
          return res.status(400).json({ error: 'Image too large (max 2MB)' });
        }

        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `profile-${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExtension}`;
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, buffer);
        profileImagePath = `/uploads/${filename}`;
      } catch (imageError) {
        console.error('Image processing error:', imageError);
        // keep old image
      }
    }

    // Update User
    await user.update({ ...userUpdateData, profile_image: profileImagePath });

    // ── Update TraderProfile if user is a trader ──
    if (user.role === 'trader') {
      const profile = await TraderProfile.findOne({ where: { user_id: user.id } });
      if (profile) {
        const traderUpdate = {};
        traderFields.forEach(field => {
          if (rest[field] !== undefined) traderUpdate[field] = rest[field];
        });
        if (rest.description !== undefined) {
          traderUpdate.description = rest.description;
        }
        await profile.update(traderUpdate);
      }
    }

    // Return updated user (exclude password)
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: TraderProfile, required: false }]
    });
    res.json(updatedUser);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: err.message });
  }
};
// userController.js
exports.getTraderById = async (req, res) => {
  try {
    const trader = await User.findOne({
      where: { id: req.params.id, role: 'trader', is_active: true },
      attributes: { exclude: ['password_hash'] },
      include: [{ model: TraderProfile }]
    });
    if (!trader) return res.status(404).json({ error: 'Trader not found' });
    res.json(trader);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLoyaltyStatus = async (req, res) => {
  try {
    const loyalties = await Loyalty.findAll({
      where: { customer_id: req.user.id },
      include: [{ model: User, as: 'trader', attributes: ['id', 'full_name', 'username'] }]
    });
    res.json(loyalties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReferrals = async (req, res) => {
  try {
    const rewards = await ReferralReward.findAll({
      where: { referrer_id: req.user.id },
      include: [{ model: User, as: 'referred_user', attributes: ['id', 'full_name', 'username'] }]
    });
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    await notification.update({ is_read: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// userController.js
exports.getAgents = async (req, res) => {
  try {
    const agents = await User.findAll({
      where: { role: 'agent', is_active: true },
      attributes: ['id', 'full_name', 'username', 'phone'],
    });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// userController.js
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: TraderProfile, required: false }]
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// controllers/userController.js

// ─── Get all traders (with filters) ──────────────────────────────────
exports.getTraders = async (req, res) => {
  try {
    const { district, sector, cell, business_category } = req.query;
    const where = { role: 'trader', is_active: true };
    
    if (district) where['$TraderProfile.district$'] = district;
    if (sector) where['$TraderProfile.sector$'] = sector;
    if (cell) where['$TraderProfile.cell$'] = cell;
    if (business_category) where['$TraderProfile.business_category$'] = business_category;

    const traders = await User.findAll({
      where,
      attributes: ['id', 'full_name', 'username', 'phone', 'profile_image'],
      include: [{
        model: TraderProfile,
        attributes: ['shop_name', 'district', 'sector', 'cell', 'village', 'coordinates', 'business_category', 'description']
      }]
    });
    res.json(traders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Get nearby traders (based on lat/lng) ──────────────────────────
exports.getNearbyTraders = async (req, res) => {
  try {
    const { lat, lng, radius = 10, business_category } = req.query; // radius in km
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    const traders = await User.findAll({
      where: { role: 'trader', is_active: true },
      attributes: ['id', 'full_name', 'username', 'phone', 'profile_image'],
      include: [{
        model: TraderProfile,
        attributes: ['shop_name', 'district', 'sector', 'cell', 'village', 'coordinates', 'business_category', 'description'],
        where: business_category ? { business_category } : {}
      }]
    });

    // Filter by distance (simple Haversine approximation)
    const R = 6371; // Earth radius in km
    const toRad = (deg) => deg * Math.PI / 180;
    const parseCoords = (coordStr) => {
      if (!coordStr) return null;
      const parts = coordStr.split(',').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { lat: parts[0], lng: parts[1] };
      }
      return null;
    };

    const nearby = traders.filter(trader => {
      const coords = parseCoords(trader.TraderProfile?.coordinates);
      if (!coords) return false;
      const dLat = toRad(coords.lat - parseFloat(lat));
      const dLng = toRad(coords.lng - parseFloat(lng));
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(toRad(parseFloat(lat))) * Math.cos(toRad(coords.lat)) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      return distance <= parseFloat(radius);
    });

    res.json(nearby);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// controllers/userController.js (add this function)
exports.savePushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    // Update user's push_token
    await req.user.update({ push_token: token });
    res.json({ message: 'Push token saved' });
  } catch (err) {
    console.error('Error saving push token:', err);
    res.status(500).json({ error: err.message });
  }
};