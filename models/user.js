module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    full_name: { type: DataTypes.STRING(100), allowNull: false },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(100), unique: true, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    profile_image: { type: DataTypes.STRING(255) },
    description: { type: DataTypes.TEXT },
    role: { type: DataTypes.ENUM('customer', 'trader', 'agent', 'admin'), defaultValue: 'customer' },
    google_id: { type: DataTypes.STRING(255), unique: true },
    referral_code: { type: DataTypes.STRING(20), unique: true, allowNull: false },
    referred_by: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' } },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: (user) => {
        if (!user.referral_code) {
          user.referral_code = 'UMU' + Math.random().toString(36).substring(2, 8).toUpperCase();
        }
      }
    }
  });
  return User;
};