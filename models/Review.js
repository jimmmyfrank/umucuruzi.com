module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    customer_id: { type: DataTypes.INTEGER, allowNull: false },
    target_type: { type: DataTypes.ENUM('product', 'trader'), allowNull: false },
    target_id: { type: DataTypes.INTEGER, allowNull: false },
    rating: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
    comment: DataTypes.TEXT
  }, {
    tableName: 'reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return Review;
};