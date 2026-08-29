module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    trader_id: { type: DataTypes.INTEGER, allowNull: false },
    category_id: DataTypes.INTEGER,
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: DataTypes.TEXT,
    price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    images: { type: DataTypes.JSON, defaultValue: [] }, // ✅ JSON column
    stock_quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Product;
};