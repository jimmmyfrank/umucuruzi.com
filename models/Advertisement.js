module.exports = (sequelize, DataTypes) => {
  const Advertisement = sequelize.define('Advertisement', {
    title: { type: DataTypes.STRING(100), allowNull: false },
    image_url: DataTypes.STRING(255),
    link_url: DataTypes.STRING(255),
    placement: { type: DataTypes.ENUM('homepage', 'product_detail', 'market', 'all'), defaultValue: 'homepage' },
    start_date: DataTypes.DATEONLY,
    end_date: DataTypes.DATEONLY,
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    clicks: { type: DataTypes.INTEGER, defaultValue: 0 },
    impressions: { type: DataTypes.INTEGER, defaultValue: 0 },
    subtitle: {type: DataTypes.STRING },
    description : {type : DataTypes.STRING},
    advertiser_image : {type : DataTypes.STRING}
  }, {
    tableName: 'advertisements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Advertisement;
};