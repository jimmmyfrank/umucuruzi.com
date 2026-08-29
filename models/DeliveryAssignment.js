module.exports = (sequelize, DataTypes) => {
  const DeliveryAssignment = sequelize.define('DeliveryAssignment', {
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    agent_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'accepted', 'picked_up', 'in_transit', 'delivered'), defaultValue: 'pending' }
  }, {
    tableName: 'delivery_assignments',
    timestamps: true,
    createdAt: 'assigned_at',
    updatedAt: 'updated_at'
  });
  return DeliveryAssignment;
};