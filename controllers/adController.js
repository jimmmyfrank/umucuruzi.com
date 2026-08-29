const { Advertisement } = require('../models');

exports.getActiveAds = async (req, res) => {
  try {
    const ads = await Advertisement.findAll({
      where: { is_active: true },
      order: [['created_at', 'DESC']]
    });
    res.json(ads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};