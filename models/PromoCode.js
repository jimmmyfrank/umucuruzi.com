module.exports = (sequelize, DataTypes) => {
  const PromoCode = sequelize.define('PromoCode', {
    trader_id: { type: DataTypes.INTEGER, allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    discount_type: { type: DataTypes.ENUM('percentage', 'fixed'), allowNull: false },
    discount_value: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    usage_limit: DataTypes.INTEGER,
    used_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    description: DataTypes.TEXT,
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'promo_codes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return PromoCode;
};