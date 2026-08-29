module.exports = (sequelize, DataTypes) => {
  const ReferralReward = sequelize.define('ReferralReward', {
    referrer_id: { type: DataTypes.INTEGER, allowNull: false },
    referred_user_id: { type: DataTypes.INTEGER, allowNull: false },
    points_awarded: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'referral_rewards',
    timestamps: true,
    createdAt: 'awarded_at',
    updatedAt: false
  });
  return ReferralReward;
};