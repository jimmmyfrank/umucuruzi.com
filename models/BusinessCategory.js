
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BusinessCategory = sequelize.define('BusinessCategory', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    group_name: { type: DataTypes.STRING(50), allowNull: true },
    icon: { type: DataTypes.STRING(50), defaultValue: 'storefront-outline' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'business_categories',
    timestamps: false,
    updatedAt: false,
  });
  return BusinessCategory;
};
