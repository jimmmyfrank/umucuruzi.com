module.exports = (sequelize, DataTypes) => {
  const Loyalty = sequelize.define('Loyalty', {
    customer_id: { type: DataTypes.INTEGER, allowNull: false },
    trader_id: { type: DataTypes.INTEGER, allowNull: false },
    points: { type: DataTypes.INTEGER, defaultValue: 0 },
    last_order_date: DataTypes.DATE
  }, {
    tableName: 'customer_trader_loyalty',
    timestamps: false
  });

  // ─── Add associations with aliases ───
  Loyalty.associate = (models) => {
    Loyalty.belongsTo(models.User, { foreignKey: 'customer_id', as: 'customer' });
    Loyalty.belongsTo(models.User, { foreignKey: 'trader_id', as: 'trader' });
  };

  return Loyalty;
};