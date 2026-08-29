module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    name: { type: DataTypes.STRING(50), allowNull: false },
    description: DataTypes.TEXT,
    icon: DataTypes.STRING(255)
  }, {
    tableName: 'categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // ✅ no updated_at column in DB
  });
  return Category;
};