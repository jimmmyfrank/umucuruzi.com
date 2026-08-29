module.exports = (sequelize, DataTypes) => {
  const TraderProfile = sequelize.define('TraderProfile', {
    user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    shop_name: { type: DataTypes.STRING(100), allowNull: false },
    district: DataTypes.STRING(50),
    sector: DataTypes.STRING(50),
    cell: DataTypes.STRING(50),
    village: DataTypes.STRING(50),
    coordinates: DataTypes.STRING(100),
    description: DataTypes.TEXT,
    business_category: DataTypes.STRING(100),
    payment_code: DataTypes.STRING(50),
    payment_phone: DataTypes.STRING(20),
    is_paid: { type: DataTypes.BOOLEAN, defaultValue: true },
    rating_avg: { type: DataTypes.DECIMAL(2,1), defaultValue: 0 }
  }, {
    tableName: 'trader_profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return TraderProfile;
};