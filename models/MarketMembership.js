module.exports = (sequelize, DataTypes) => {
  const MarketMembership = sequelize.define('MarketMembership', {
    market_id: { type: DataTypes.INTEGER, allowNull: false },
    trader_id: { type: DataTypes.INTEGER, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'market_memberships',
    timestamps: true,
    createdAt: 'joined_at',
    updatedAt: false
  });
  return MarketMembership;
};