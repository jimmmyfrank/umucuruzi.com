const { DeliveryAssignment, Order, User, Notification } = require('../models');

exports.getRequests = async (req, res) => {
  try {
    const assignments = await DeliveryAssignment.findAll({
      where: { agent_id: req.user.id },
      include: [
        { model: Order, include: [
          { model: User, as: 'customer', attributes: ['id', 'full_name', 'phone'] },
          { model: User, as: 'trader', attributes: ['id', 'full_name', 'phone'] }
        ]}
      ],
      order: [['assigned_at', 'DESC']]
    });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findOne({
      where: { id: req.params.id, agent_id: req.user.id, status: 'pending' }
    });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found or already accepted' });
    await assignment.update({ status: 'accepted' });
    const order = await Order.findByPk(assignment.order_id);
    if (order) {
      await order.update({ order_status: 'processing', delivery_agent_id: req.user.id });
      // Notify customer
      await Notification.create({
        user_id: order.customer_id,
        type: 'push',
        title: 'Delivery Accepted',
        message: `Your order ${order.id} has been accepted by agent ${req.user.full_name}`
      });
    }
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findOne({
      where: { id: req.params.id, agent_id: req.user.id }
    });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    const newStatus = req.body.status;
    if (!['picked_up', 'in_transit', 'delivered'].includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await assignment.update({ status: newStatus });
    const order = await Order.findByPk(assignment.order_id);
    if (order) {
      let orderStatus = 'processing';
      if (newStatus === 'picked_up') orderStatus = 'processing';
      else if (newStatus === 'in_transit') orderStatus = 'in_transit';
      else if (newStatus === 'delivered') orderStatus = 'delivered';
      await order.update({ order_status: orderStatus });
      // Notify customer
      await Notification.create({
        user_id: order.customer_id,
        type: 'push',
        title: `Delivery ${newStatus}`,
        message: `Your order ${order.id} is now ${newStatus}`
      });
    }
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};