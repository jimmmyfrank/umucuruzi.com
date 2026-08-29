const { PriceTableItem } = require('../models');

exports.getPriceTableForTrader = async (req, res) => {
  try {
    const traderId = req.params.traderId;
    const items = await PriceTableItem.findAll({
      where: { trader_id: traderId },
      order: [['sort_order', 'ASC']]
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};