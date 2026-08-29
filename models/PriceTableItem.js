module.exports = (sequelize, DataTypes) => {
  const PriceTableItem = sequelize.define('PriceTableItem', {
    trader_id: { type: DataTypes.INTEGER, allowNull: false },
    product_name: { type: DataTypes.STRING(100), allowNull: false },
    unit: DataTypes.STRING(20),
    price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, {
    tableName: 'price_table_items',
    timestamps: false
  });
  return PriceTableItem;
};