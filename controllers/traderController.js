const {
  TraderProfile, Product, PriceTableItem,
  Order, OrderItem, User, Loyalty,
  DeliveryAssignment, Category, Notification,
  BusinessCategory, sequelize,
} = require('../models');
const { Op } = require('sequelize');
const QRCode = require('qrcode');
const { sendPushNotification } = require('../utils/sendPushNotification');

// ─── Helper: create an in-app notification ─────────────────────────
const createNotification = async (userId, title, message) => {
  try {
    await Notification.create({
      user_id: userId,
      type: 'push',
      title,
      message,
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// ─── Helper: haversine distance (km) ───────────────────────────────
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ═══════════════════════════════════════════════════════════════════
//  PROFILE
// ═══════════════════════════════════════════════════════════════════
exports.getProfile = async (req, res) => {
  try {
    const profile = await TraderProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Trader profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const profile = await TraderProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    await profile.update(req.body);
    await req.user.update({ description: req.body.description });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
//  PRODUCTS
// ═══════════════════════════════════════════════════════════════════
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category_id, stock_quantity } = req.body;
    const files = req.files || [];

    if (!name || !price) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }

    const imagePaths = files.map((f) => `/uploads/${f.filename}`);

    let categoryId = null;
    if (category_id) {
      const category = await Category.findByPk(category_id);
      if (!category) return res.status(400).json({ error: 'Category not found' });
      categoryId = category_id;
    }

    const product = await Product.create({
      trader_id: req.user.id,
      name: name.trim(),
      description: description ? description.trim() : null,
      price: parsedPrice,
      category_id: categoryId,
      stock_quantity: parseInt(stock_quantity) || 0,
      images: imagePaths,
      is_active: true,
    });

    res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { trader_id: req.user.id },
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, trader_id: req.user.id },
      include: [{ model: Category, attributes: ['id', 'name'] }],
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, trader_id: req.user.id },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const {
      name, description, price, category_id,
      stock_quantity, is_active, existing_images,
    } = req.body;
    const files = req.files || [];

    if (price !== undefined) {
      const parsed = parseFloat(price);
      if (isNaN(parsed) || parsed < 0) return res.status(400).json({ error: 'Invalid price' });
      product.price = parsed;
    }
    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (stock_quantity !== undefined) {
      const s = parseInt(stock_quantity);
      if (isNaN(s) || s < 0) return res.status(400).json({ error: 'Invalid stock' });
      product.stock_quantity = s;
    }
    if (category_id !== undefined) {
      if (category_id) {
        const cat = await Category.findByPk(category_id);
        if (!cat) return res.status(400).json({ error: 'Category not found' });
        product.category_id = category_id;
      } else {
        product.category_id = null;
      }
    }
    if (is_active !== undefined) product.is_active = is_active;

    let finalImages = [];
    if (existing_images) {
      try {
        const parsed = JSON.parse(existing_images);
        if (Array.isArray(parsed)) finalImages = parsed;
      } catch (_) {}
    }
    finalImages = [...finalImages, ...files.map((f) => `/uploads/${f.filename}`)];
    product.images = finalImages;

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, trader_id: req.user.id },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
//  PRICE TABLE
// ═══════════════════════════════════════════════════════════════════
exports.getPriceTable = async (req, res) => {
  try {
    const items = await PriceTableItem.findAll({
      where: { trader_id: req.user.id },
      order: [['sort_order', 'ASC']],
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addPriceTableItem = async (req, res) => {
  try {
    const { product_name, unit, price, sort_order } = req.body;
    if (!product_name || price === undefined) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }
    const item = await PriceTableItem.create({
      trader_id: req.user.id,
      product_name: product_name.trim(),
      unit: unit || null,
      price: parsedPrice,
      sort_order: sort_order || 0,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePriceTableItem = async (req, res) => {
  try {
    const item = await PriceTableItem.findOne({
      where: { id: req.params.id, trader_id: req.user.id },
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.update(req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePriceTableItem = async (req, res) => {
  try {
    const item = await PriceTableItem.findOne({
      where: { id: req.params.id, trader_id: req.user.id },
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.destroy();
    res.json({ message: 'Price item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
//  ORDERS
// ═══════════════════════════════════════════════════════════════════
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { trader_id: req.user.id },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'full_name', 'username', 'phone', 'email', 'profile_image'],
        },
        { model: OrderItem, include: [{ model: Product }] },
        {
          model: DeliveryAssignment,
          include: [{ model: User, as: 'agent', attributes: ['id', 'full_name', 'username'] }],
        },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getTraderOrders = exports.getOrders; // alias

exports.updateOrderStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const traderId = req.user.id;

    const validStatuses = [
      'pending', 'processing', 'ready', 'in_transit', 'delivered', 'cancelled',
    ];
    if (!validStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findOne({
      where: { id, trader_id: traderId },
      transaction,
    });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.update({ order_status: status }, { transaction });

    if (status === 'delivered') {
      const assignment = await DeliveryAssignment.findOne({
        where: { order_id: order.id },
        transaction,
      });
      if (assignment) {
        await assignment.update({ status: 'delivered' }, { transaction });
      }
    }

    await transaction.commit();

    const title = `Order #${order.id} updated`;
    const message = `Your order status is now: ${status.replace('_', ' ').toUpperCase()}`;
    await createNotification(order.customer_id, title, message);

    res.json({ message: 'Order status updated', order });
  } catch (err) {
    await transaction.rollback();
    console.error('Error updating order status:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.assignAgent = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, trader_id: req.user.id },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const { agent_id } = req.body;
    if (!agent_id) return res.status(400).json({ error: 'Agent ID required' });

    const agent = await User.findOne({
      where: { id: agent_id, role: 'agent', is_active: true },
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found or inactive' });

    order.delivery_agent_id = agent_id;
    await order.save();

    const assignment = await DeliveryAssignment.findOne({ where: { order_id: order.id } });
    if (assignment) {
      await assignment.update({ agent_id, status: 'pending', assigned_at: new Date() });
    } else {
      await DeliveryAssignment.create({
        order_id: order.id,
        agent_id,
        assigned_at: new Date(),
        status: 'pending',
      });
    }

    res.json({ message: 'Agent assigned successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
//  LOYAL CUSTOMERS + DASHBOARD
// ═══════════════════════════════════════════════════════════════════
exports.getLoyalCustomers = async (req, res) => {
  try {
    const loyalties = await Loyalty.findAll({
      where: { trader_id: req.user.id },
      include: [
        { model: User, as: 'customer', attributes: ['id', 'full_name', 'username', 'phone', 'email'] },
      ],
      order: [['points', 'DESC']],
    });
    res.json(loyalties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const traderId = req.user.id;
    const totalOrders = await Order.count({ where: { trader_id: traderId } });
    const deliveredOrders = await Order.count({
      where: { trader_id: traderId, order_status: 'delivered' },
    });
    const totalProducts = await Product.count({ where: { trader_id: traderId } });
    const totalCustomers = await Order.count({
      where: { trader_id: traderId },
      distinct: true,
      col: 'customer_id',
    });
    const revenue = await Order.sum('final_amount', {
      where: { trader_id: traderId, order_status: 'delivered' },
    });

    const recentOrders = await Order.findAll({
      where: { trader_id: traderId },
      include: [{ model: User, as: 'customer', attributes: ['full_name'] }],
      order: [['created_at', 'DESC']],
      limit: 5,
    });

    res.json({
      totalOrders,
      deliveredOrders,
      totalProducts,
      totalCustomers,
      revenue: revenue || 0,
      recentOrders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
//  QR CODE
// ═══════════════════════════════════════════════════════════════════
exports.getTraderQR = async (req, res) => {
  try {
    const traderId = req.user.id;
    const baseUrl = process.env.QR_BASE_URL || 'http://localhost:5000';
    const profileUrl = `${baseUrl}/trader/${traderId}`;
    const qrDataUrl = await QRCode.toDataURL(profileUrl);

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.json({ qr: qrDataUrl });
  } catch (err) {
    console.error('QR generation error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

// ═══════════════════════════════════════════════════════════════════
//  NEARBY TRADERS
// ═══════════════════════════════════════════════════════════════════
exports.getNearbyTraders = async (req, res) => {
  try {
    const {
      lat, lng,
      radius = 50,
      category,
      sort = 'distance',
      district,
      sector,
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radius);

    const traders = await User.findAll({
      where: { role: 'trader', is_active: true },
      attributes: [
        'id', 'full_name', 'username', 'phone', 'email',
        'profile_image', 'description',
      ],
      include: [{ model: TraderProfile, required: false }],
    });

    // 1. Category filter (soft match: trims whitespace, case-insensitive)
    let filtered = traders;
    if (category) {
      const catLower = String(category).toLowerCase().trim();
      filtered = filtered.filter((t) => {
        const bc = (t.TraderProfile?.business_category || '')
          .toLowerCase()
          .trim();
        return bc === catLower;
      });
    }

    // 2. Compute distance for those with GPS
    const withDistance = filtered.map((t) => {
      const plain = t.toJSON();
      const coords = plain.TraderProfile?.coordinates;
      let distance = null;
      if (coords && typeof coords === 'string') {
        const [latStr, lngStr] = coords.split(',').map((s) => s.trim());
        const pLat = parseFloat(latStr);
        const pLng = parseFloat(lngStr);
        if (!isNaN(pLat) && !isNaN(pLng)) {
          distance = getDistanceKm(userLat, userLng, pLat, pLng);
        }
      }
      return { ...plain, distance };
    });

    // 3. Mark which are within radius — DON'T exclude them anymore
    const withFlag = withDistance.map((t) => {
      const withinRadius =
        t.distance !== null && t.distance <= maxRadius;
      return { ...t, withinRadius };
    });

    // 4. Sort
    if (sort === 'distance') {
      withFlag.sort((a, b) => {
        const da = a.distance === null ? Infinity : a.distance;
        const db = b.distance === null ? Infinity : b.distance;
        return da - db;
      });
    } else if (sort === 'rating') {
      withFlag.sort(
        (a, b) =>
          (parseFloat(b.TraderProfile?.rating_avg) || 0) -
          (parseFloat(a.TraderProfile?.rating_avg) || 0)
      );
    } else if (sort === 'name') {
      withFlag.sort((a, b) =>
        (a.TraderProfile?.shop_name || a.full_name || '').localeCompare(
          b.TraderProfile?.shop_name || b.full_name || ''
        )
      );
    }

    res.json(withFlag);
  } catch (err) {
    console.error('getNearbyTraders error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
//  BUSINESS CATEGORIES (public)
// ═══════════════════════════════════════════════════════════════════
exports.getBusinessCategories = async (req, res) => {
  try {
    const cats = await BusinessCategory.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC']],
    });
    res.json(cats);
  } catch (err) {
    console.error('getBusinessCategories error:', err);
    res.status(500).json({ error: err.message });
  }
};
