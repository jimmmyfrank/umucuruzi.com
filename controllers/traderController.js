const { TraderProfile, Product, PriceTableItem, 
  Order, OrderItem, User, Loyalty,
   DeliveryAssignment, Category ,
   Notification,
  sequelize
  } = require('../models');
const { Op } = require('sequelize');

const createNotification = async (userId, title, message) => {
  try {
    await Notification.create({
      user_id: userId,
      type: 'push',
      title,
      message
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

const { sendPushNotification } = require('../utils/sendPushNotification');



// ---------- Profile ----------
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
exports.getTraderOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { trader_id: req.user.id },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'full_name', 'username', 'phone', 'email', 'profile_image']
        },
        {
          model: OrderItem,
          include: [{ model: Product }]
        },
        {
          model: DeliveryAssignment,
          include: [{ model: User, as: 'agent', attributes: ['id', 'full_name', 'username'] }]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Add this function after getProducts
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, trader_id: req.user.id },
      include: [{ model: Category, attributes: ['id', 'name'] }]
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


// ... (other functions unchanged)

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

    // ✅ Save image URLs (relative paths)
    const imagePaths = files.map(file => `/uploads/${file.filename}`);

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
      images: imagePaths,  // ← array of strings
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
      order: [['created_at', 'DESC']]
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ where: { id: req.params.id, trader_id: req.user.id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const { name, description, price, category_id, stock_quantity, is_active, existing_images } = req.body;
    const files = req.files || [];

    // Update basic fields
    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) return res.status(400).json({ error: 'Invalid price' });
      product.price = parsedPrice;
    }
    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (stock_quantity !== undefined) {
      const parsedStock = parseInt(stock_quantity);
      if (isNaN(parsedStock) || parsedStock < 0) return res.status(400).json({ error: 'Invalid stock' });
      product.stock_quantity = parsedStock;
    }
    if (category_id !== undefined) {
      if (category_id) {
        const category = await Category.findByPk(category_id);
        if (!category) return res.status(400).json({ error: 'Category not found' });
        product.category_id = category_id;
      } else {
        product.category_id = null;
      }
    }
    if (is_active !== undefined) product.is_active = is_active;

    // Handle images: merge existing and new
    let finalImages = [];
    if (existing_images) {
      try {
        const parsedExisting = JSON.parse(existing_images);
        if (Array.isArray(parsedExisting)) {
          finalImages = parsedExisting;
        }
      } catch (e) {
        // ignore
      }
    }
    const newImagePaths = files.map(file => `/uploads/${file.filename}`);
    finalImages = [...finalImages, ...newImagePaths];
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
    const product = await Product.findOne({ where: { id: req.params.id, trader_id: req.user.id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- Price Table ----------
exports.getPriceTable = async (req, res) => {
  try {
    const items = await PriceTableItem.findAll({
      where: { trader_id: req.user.id },
      order: [['sort_order', 'ASC']]
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
      sort_order: sort_order || 0
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePriceTableItem = async (req, res) => {
  try {
    const item = await PriceTableItem.findOne({ where: { id: req.params.id, trader_id: req.user.id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.update(req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePriceTableItem = async (req, res) => {
  try {
    const item = await PriceTableItem.findOne({ where: { id: req.params.id, trader_id: req.user.id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.destroy();
    res.json({ message: 'Price item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- Orders ----------
// ─── Customer: get their orders ────────────────────────────────────────
exports.getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { customer_id: req.user.id },
      include: [
        {
          model: User,
          as: 'trader',
          attributes: ['id', 'full_name', 'username', 'phone', 'email', 'profile_image'],
          include: [{ model: TraderProfile, attributes: ['shop_name', 'district', 'sector'] }]
        },
        {
          model: OrderItem,
          include: [{ model: Product }]
        },
        {
          model: DeliveryAssignment,
          include: [{ model: User, as: 'agent', attributes: ['id', 'full_name', 'username'] }]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Trader: get their orders (for trader dashboard) ─────────────────
// (If you have a separate controller for trader orders, update it similarly)
// In traderController.js:
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { trader_id: req.user.id },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'full_name', 'username', 'phone', 'email', 'profile_image']
        },
        {
          model: OrderItem,
          include: [{ model: Product }]
        },
        {
          model: DeliveryAssignment,
          include: [{ model: User, as: 'agent', attributes: ['id', 'full_name', 'username'] }]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
// traderController.js

exports.updateOrderStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const traderId = req.user.id;

    // Validate status
    const validStatuses = ['pending', 'processing', 'ready', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Find order – must belong to this trader
    const order = await Order.findOne({
      where: { id: orderId, trader_id: traderId },
      transaction,
    });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update status
    await order.update({ order_status: status }, { transaction });

    // If status is 'delivered', update delivery assignment if exists
    if (status === 'delivered') {
      const assignment = await DeliveryAssignment.findOne({
        where: { order_id: order.id },
        transaction,
      });
      if (assignment) {
        await assignment.update({ status: 'delivered' }, { transaction });
      }
    }

    // Commit transaction
    await transaction.commit();

    // ─── Notify customer (in-app + push) ──────────────────────────
    const title = `Order #${order.id} updated`;
    const message = `Your order status is now: ${status.replace('_', ' ').toUpperCase()}`;
    await createNotification(order.customer_id, title, message, 'push', { orderId: order.id });

    // Also notify trader (optional – maybe they want to know)
    // await createNotification(traderId, `Order #${order.id} updated`, `You changed the status to ${status}`);

    res.json({ message: 'Order status updated', order });
  } catch (err) {
    await transaction.rollback();
    console.error('Error updating order status:', err);
    res.status(500).json({ error: err.message });
  }
};
;
exports.assignAgent = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, trader_id: req.user.id }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const { agent_id } = req.body;
    if (!agent_id) return res.status(400).json({ error: 'Agent ID required' });

    // Check agent exists and is active
    const agent = await User.findOne({ where: { id: agent_id, role: 'agent', is_active: true } });
    if (!agent) return res.status(404).json({ error: 'Agent not found or inactive' });

    // Assign agent to order
    order.delivery_agent_id = agent_id;
    await order.save();

    // Create or update delivery assignment
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

    // Optionally notify agent (push notification)
    // ...

    res.json({ message: 'Agent assigned successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
// ---------- Loyal Customers ----------
exports.getLoyalCustomers = async (req, res) => {
  try {
    const loyalties = await Loyalty.findAll({
      where: { trader_id: req.user.id },
      include: [{ model: User, as: 'customer', attributes: ['id', 'full_name', 'username', 'phone', 'email'] }],
      order: [['points', 'DESC']]
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
      where: { trader_id: traderId, order_status: 'delivered' } 
    });
    const totalProducts = await Product.count({ where: { trader_id: traderId } });
    const totalCustomers = await Order.count({
      where: { trader_id: traderId },
      distinct: true,
      col: 'customer_id'
    });
    const revenue = await Order.sum('final_amount', { 
      where: { trader_id: traderId, order_status: 'delivered' } 
    });

    // Recent orders (last 5)
    const recentOrders = await Order.findAll({
      where: { trader_id: traderId },
      include: [{ model: User, as: 'customer', attributes: ['full_name'] }],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    res.json({ 
      totalOrders, 
      deliveredOrders, 
      totalProducts, 
      totalCustomers, 
      revenue: revenue || 0,
      recentOrders
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
const QRCode = require('qrcode');

exports.getTraderQR = async (req, res) => {
  try {
    const traderId = req.user.id; // from auth middleware
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