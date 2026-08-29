const { Loyalty, User, Order, DeliveryAssignment, Review, TraderProfile, sequelize } = require('../models');

// ─── Trader: loyal customers ─────────────────────────────────────────
exports.getLoyalCustomers = async (req, res) => {
  try {
    const traderId = req.user.id;
    const loyalties = await Loyalty.findAll({
      where: { trader_id: traderId },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'full_name', 'username', 'profile_image', 'phone'],
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*) FROM orders 
              WHERE orders.customer_id = Loyalty.customer_id 
              AND orders.trader_id = ${traderId}
              AND orders.order_status = 'delivered'
            )`),
            'orderCount'
          ],
          [
            sequelize.literal(`(
              SELECT AVG(rating) FROM reviews 
              WHERE reviews.target_type = 'trader' 
              AND reviews.target_id = ${traderId}
              AND reviews.customer_id = Loyalty.customer_id
            )`),
            'avgRating'
          ]
        ]
      },
      order: [['points', 'DESC']]
    });
    res.json(loyalties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Customer: trusted traders ────────────────────────────────────────
exports.getTrustedTraders = async (req, res) => {
  try {
    const customerId = req.user.id;
    const loyalties = await Loyalty.findAll({
      where: { customer_id: customerId },
      include: [
        {
          model: User,
          as: 'trader',
          attributes: ['id', 'full_name', 'username', 'profile_image', 'phone'],
          include: [{ model: TraderProfile, attributes: ['shop_name'] }]
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*) FROM orders 
              WHERE orders.customer_id = ${customerId}
              AND orders.trader_id = Loyalty.trader_id
              AND orders.order_status = 'delivered'
            )`),
            'orderCount'
          ],
          [
            sequelize.literal(`(
              SELECT AVG(rating) FROM reviews 
              WHERE reviews.target_type = 'trader' 
              AND reviews.target_id = Loyalty.trader_id
              AND reviews.customer_id = ${customerId}
            )`),
            'avgRating'
          ]
        ]
      },
      order: [['points', 'DESC']]
    });
    res.json(loyalties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Trader: delivery agents who delivered their orders ──────────────
exports.getTraderDeliveryAgents = async (req, res) => {
  try {
    const traderId = req.user.id;
    const agents = await DeliveryAssignment.findAll({
      where: { status: 'delivered' },
      include: [
        {
          model: Order,
          as: 'Order',
          where: { trader_id: traderId, order_status: 'delivered' },
          attributes: []
        },
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'full_name', 'username', 'profile_image', 'phone']
        }
      ],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('Order.id')), 'orderCount'],
          [
            sequelize.literal(`(
              SELECT AVG(rating) FROM reviews 
              WHERE reviews.target_type = 'agent' 
              AND reviews.target_id = agent.id
              AND reviews.customer_id = Order.customer_id
            )`),
            'avgRating'
          ]
        ]
      },
      group: ['agent.id'],
      order: [[sequelize.literal('orderCount'), 'DESC']]
    });
    res.json(agents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Customer: delivery agents who delivered to them ─────────────────
exports.getCustomerDeliveryAgents = async (req, res) => {
  try {
    const customerId = req.user.id;
    const agents = await DeliveryAssignment.findAll({
      where: { status: 'delivered' },
      include: [
        {
          model: Order,
          as: 'Order',
          where: { customer_id: customerId, order_status: 'delivered' },
          attributes: []
        },
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'full_name', 'username', 'profile_image', 'phone']
        }
      ],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('Order.id')), 'orderCount'],
          [
            sequelize.literal(`(
              SELECT AVG(rating) FROM reviews 
              WHERE reviews.target_type = 'agent' 
              AND reviews.target_id = agent.id
              AND reviews.customer_id = ${customerId}
            )`),
            'avgRating'
          ]
        ]
      },
      group: ['agent.id'],
      order: [[sequelize.literal('orderCount'), 'DESC']]
    });
    res.json(agents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Agent: delivery history ──────────────────────────────────────────
exports.getAgentDeliveryHistory = async (req, res) => {
  try {
    const agentId = req.user.id;
    const assignments = await DeliveryAssignment.findAll({
      where: { agent_id: agentId, status: 'delivered' },
      include: [
        {
          model: Order,
          as: 'Order',
          include: [
            { model: User, as: 'customer', attributes: ['id', 'full_name', 'username', 'phone'] },
            { model: User, as: 'trader', attributes: ['id', 'full_name', 'username', 'phone'] }
          ]
        }
      ],
      order: [['updated_at', 'DESC']]
    });
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
// ─── Public: get delivery history for a specific agent ──────────────
exports.getAgentDeliveriesById = async (req, res) => {
  try {
    const agentId = req.params.agentId;

    const assignments = await DeliveryAssignment.findAll({
      where: { agent_id: agentId, status: 'delivered' },
      include: [
        {
          model: Order,
          as: 'Order',
          include: [
            { model: User, as: 'customer', attributes: ['id', 'full_name', 'username', 'phone'] },
            { model: User, as: 'trader', attributes: ['id', 'full_name', 'username', 'phone'] }
          ]
        }
      ],
      order: [['updated_at', 'DESC']]
    });

    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};