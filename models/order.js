module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    customer_id: { type: DataTypes.INTEGER, allowNull: false },
    trader_id: { type: DataTypes.INTEGER, allowNull: false },
    delivery_type: { type: DataTypes.ENUM('direct', 'pickup', 'delivery'), allowNull: false },
    delivery_agent_id: DataTypes.INTEGER,
    delivery_address: DataTypes.TEXT,
    delivery_fee: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    total_amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    promo_code_id: DataTypes.INTEGER,
    discount_amount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    final_amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    order_status: { type: DataTypes.ENUM('pending', 'processing', 'ready', 'in_transit', 'delivered', 'cancelled'), defaultValue: 'pending' },
    payment_status: { type: DataTypes.ENUM('pending', 'paid'), defaultValue: 'pending' },
    payment_method: { type: DataTypes.ENUM('online', 'pay_on_store', 'pay_on_delivery'), defaultValue: 'pay_on_delivery' }
  }, {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Order;
};