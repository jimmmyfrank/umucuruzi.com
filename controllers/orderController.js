const { Order, OrderItem, Product, User, TraderProfile, DeliveryAssignment, Loyalty, Notification, CartItem,sequelize } = require('../models');
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

exports.createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Removed promo_code from destructuring
    const { delivery_type, delivery_address, payment_method } = req.body;
    
    // Get cart items
    const cartItems = await CartItem.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Product }],
      transaction
    });
    
    if (cartItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Group by trader
    const grouped = cartItems.reduce((acc, item) => {
      const traderId = item.Product.trader_id;
      if (!acc[traderId]) acc[traderId] = { trader: item.Product.User, items: [] };
      acc[traderId].items.push(item);
      return acc;
    }, {});

    const orders = [];
    for (const traderId of Object.keys(grouped)) {
      const group = grouped[traderId];
      let total = 0;
      
      const orderItemsData = group.items.map(cart => {
        const subtotal = cart.quantity * cart.Product.price;
        total += subtotal;
        return {
          product_id: cart.Product.id,
          quantity: cart.quantity,
          price_at_time: cart.Product.price,
          subtotal
        };
      });

      // Promo code logic completely removed.
      // The total amount is now the final amount, with no discounts.
      const finalAmount = total;

      const order = await Order.create({
        customer_id: req.user.id,
        trader_id: traderId,
        delivery_type,
        delivery_address: delivery_type === 'delivery' ? delivery_address : null,
        total_amount: total,
        // promo_code_id and discount_amount columns removed to prevent DB errors
        final_amount: finalAmount,
        payment_method: payment_method || 'pay_on_delivery',
        order_status: 'pending',
        payment_status: 'pending'
      }, { transaction });

      // Create order items
      for (const itemData of orderItemsData) {
        await OrderItem.create({ ...itemData, order_id: order.id }, { transaction });
      }

      orders.push(order);

      // Notify trader about new order (push notification placeholder)
      await Notification.create({
        user_id: traderId,
        type: 'push',
        title: 'New Order',
        message: `You have a new order from ${req.user.full_name}`
      }, { transaction });
    }

    // Clear cart
    await CartItem.destroy({ where: { user_id: req.user.id }, transaction });

    await transaction.commit();
    res.status(201).json(orders);
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
// orderController.js
exports.getMyOrders = async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role === 'trader') {
      whereClause.trader_id = req.user.id;
    } else if (req.user.role === 'customer') {
      whereClause.customer_id = req.user.id;
    } else if (req.user.role === 'admin') {
      // optionally return all
    } else {
      return res.status(403).json({ error: 'Unauthorized role' });
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'customer', attributes: ['id', 'full_name', 'username', 'phone'] },
        { model: OrderItem, include: [{ model: Product }] },
        { model: DeliveryAssignment, include: [{ model: User, as: 'agent', attributes: ['id', 'full_name'] }] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
// orderController.js – getCustomerOrders

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

exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    let whereClause = { id: orderId };

    if (userRole === 'customer') {
      whereClause.customer_id = userId;
    } else if (userRole === 'trader') {
      whereClause.trader_id = userId;
    } else if (userRole === 'agent') {
      whereClause.delivery_agent_id = userId;
    } else if (userRole === 'admin') {
      // admin can view any order
    } else {
      return res.status(403).json({ error: 'Unauthorized role' });
    }

    const order = await Order.findOne({
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'customer', 
          attributes: ['id', 'full_name', 'username', 'phone', 'email', 'profile_image'] 
        },
        { 
          model: User, 
          as: 'trader', 
          attributes: ['id', 'full_name', 'username', 'phone', 'email', 'profile_image'],
          include: [
            { 
              model: TraderProfile, 
              attributes: ['shop_name', 'district', 'sector', 'description', 'payment_code', 'payment_phone'] 
            }
          ]
        },
        { 
          model: OrderItem, 
          include: [{ model: Product }] 
        },
        { 
          model: DeliveryAssignment, 
          include: [{ model: User, as: 'agent', attributes: ['id', 'full_name', 'username', 'phone'] }] 
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: err.message });
  }
};
exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, customer_id: req.user.id },
      include: [DeliveryAssignment]
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.confirmDelivery = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const orderId = req.params.id;
    const customerId = req.user.id;

    const order = await Order.findOne({
      where: {
        id: orderId,
        customer_id: customerId,
        [Op.or]: [
          { delivery_type: 'delivery', order_status: 'in_transit' },
          { delivery_type: { [Op.ne]: 'delivery' }, order_status: 'ready' }
        ]
      },
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found, or not in a confirmable state' });
    }

    await order.update({ order_status: 'delivered' }, { transaction });

    if (order.delivery_type === 'delivery') {
      const assignment = await DeliveryAssignment.findOne({ where: { order_id: order.id }, transaction });
      if (assignment) {
        await assignment.update({ status: 'delivered' }, { transaction });
      }
    }

    // Award loyalty points
    let loyalty = await Loyalty.findOne({ where: { customer_id: customerId, trader_id: order.trader_id }, transaction });
    if (!loyalty) {
      loyalty = await Loyalty.create({ customer_id: customerId, trader_id: order.trader_id, points: 0 }, { transaction });
    }
    const pointsToAdd = parseInt(process.env.LOYALTY_POINTS_PER_ORDER) || 5;
    loyalty.points += pointsToAdd;
    await loyalty.save({ transaction });

    await Notification.create({
      user_id: order.trader_id,
      type: 'push',
      title: 'Order Confirmed',
      message: `Order #${order.id} has been confirmed as received by the customer.`
    }, { transaction });

    await transaction.commit();

    // ✅ FIXED: Run notification BEFORE sending response to prevent double-send crash
    await createNotification(
      customerId,
      'Loyalty Points Earned! 🎉',
      `You earned ${pointsToAdd} loyalty points from order #${order.id}`
    );

    return res.json({
      message: 'Order confirmed successfully',
      order_status: order.order_status
    });

  } catch (err) {
    await transaction.rollback();
    console.error('Error confirming order:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message });
    }
  }
};
// traderController.js – getOrders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { trader_id: req.user.id },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'full_name', 'username', 'phone', 'email', 'profile_image'] // ✅ added profile_image
        },
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['id', 'name', 'price', 'images'] }]
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