module.exports = (sequelize, DataTypes) => {
  const PromoCodeUsage = sequelize.define('PromoCodeUsage', {
    promo_code_id: { type: DataTypes.INTEGER, allowNull: false },
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'promo_code_usage',
    timestamps: true,
    createdAt: 'used_at',
    updatedAt: false
  });
  return PromoCodeUsage;
};