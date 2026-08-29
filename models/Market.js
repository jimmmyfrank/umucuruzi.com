module.exports = (sequelize, DataTypes) => {
  const Market = sequelize.define('Market', {
    name: { type: DataTypes.STRING(100), allowNull: false },
    district: DataTypes.STRING(50),
    sector: DataTypes.STRING(50),
    cell: DataTypes.STRING(50),
    village: DataTypes.STRING(50),
    coordinates: DataTypes.STRING(100),
    description: DataTypes.TEXT,
    days_active: DataTypes.JSON,
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    logo_image: { type: DataTypes.STRING(255) },
    banner_image: { type: DataTypes.STRING(255) },
  }, {
    tableName: 'markets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Market;
};