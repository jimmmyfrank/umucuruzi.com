module.exports = (sequelize, DataTypes) => {
  const AppSetting = sequelize.define('AppSetting', {
    setting_key: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    setting_value: DataTypes.TEXT
  }, {
    tableName: 'app_settings',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at'
  });
  return AppSetting;
};