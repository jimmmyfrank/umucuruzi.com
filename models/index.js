const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Import models
const User = require('./User')(sequelize, DataTypes);
const TraderProfile = require('./TraderProfile')(sequelize, DataTypes);
const Category = require('./Category')(sequelize, DataTypes);
const Product = require('./Product')(sequelize, DataTypes);
const PriceTableItem = require('./PriceTableItem')(sequelize, DataTypes);
const Market = require('./Market')(sequelize, DataTypes);
const MarketMembership = require('./MarketMembership')(sequelize, DataTypes);
const Order = require('./Order')(sequelize, DataTypes);
const OrderItem = require('./OrderItem')(sequelize, DataTypes);
const CartItem = require('./CartItem')(sequelize, DataTypes);
const Loyalty = require('./Loyalty')(sequelize, DataTypes);
const PromoCode = require('./PromoCode')(sequelize, DataTypes);
const PromoCodeUsage = require('./PromoCodeUsage')(sequelize, DataTypes);
const Notification = require('./Notification')(sequelize, DataTypes);
const DeliveryAssignment = require('./DeliveryAssignment')(sequelize, DataTypes);
const Review = require('./Review')(sequelize, DataTypes);
const Advertisement = require('./Advertisement')(sequelize, DataTypes);
const ReferralReward = require('./ReferralReward')(sequelize, DataTypes);
const AppSetting = require('./AppSetting')(sequelize, DataTypes);

// --- Associations ---

// User ↔ TraderProfile
User.hasOne(TraderProfile, { foreignKey: 'user_id', onDelete: 'CASCADE' });
TraderProfile.belongsTo(User, { foreignKey: 'user_id' });

// User → Products (trader)
User.hasMany(Product, { foreignKey: 'trader_id', onDelete: 'CASCADE' });
Product.belongsTo(User, { foreignKey: 'trader_id', as: 'trader' });

// Category → Products
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

// User → PriceTableItems
User.hasMany(PriceTableItem, { foreignKey: 'trader_id', onDelete: 'CASCADE' });
PriceTableItem.belongsTo(User, { foreignKey: 'trader_id' });

// Market ↔ MarketMembership
Market.hasMany(MarketMembership, { foreignKey: 'market_id', onDelete: 'CASCADE' });
MarketMembership.belongsTo(Market, { foreignKey: 'market_id' });

User.hasMany(MarketMembership, { foreignKey: 'trader_id', onDelete: 'CASCADE' });
MarketMembership.belongsTo(User, { foreignKey: 'trader_id' });


// Orders
User.hasMany(Order, { foreignKey: 'customer_id', as: 'CustomerOrders' });
User.hasMany(Order, { foreignKey: 'trader_id', as: 'TraderOrders' });
User.hasMany(Order, { foreignKey: 'delivery_agent_id', as: 'AgentOrders' });
Order.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });          // ✅ add alias
Order.belongsTo(User, { foreignKey: 'trader_id', as: 'trader' });              // ✅ add alias
Order.belongsTo(User, { foreignKey: 'delivery_agent_id', as: 'deliveryAgent' }); // ✅ add alias

// Order ↔ OrderItems
Order.hasMany(OrderItem, { foreignKey: 'order_id', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

// Cart
User.hasMany(CartItem, { foreignKey: 'user_id', onDelete: 'CASCADE' });
CartItem.belongsTo(User, { foreignKey: 'user_id' });
Product.hasMany(CartItem, { foreignKey: 'product_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

// Loyalty
// Loyalty
User.hasMany(Loyalty, { foreignKey: 'customer_id', onDelete: 'CASCADE' });
User.hasMany(Loyalty, { foreignKey: 'trader_id', onDelete: 'CASCADE' });
Loyalty.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });   // ✅ added alias
Loyalty.belongsTo(User, { foreignKey: 'trader_id', as: 'trader' });       // ✅ added alias

// Promo codes
User.hasMany(PromoCode, { foreignKey: 'trader_id', onDelete: 'CASCADE' });
PromoCode.belongsTo(User, { foreignKey: 'trader_id' });

Order.belongsTo(PromoCode, { foreignKey: 'promo_code_id' });
PromoCode.hasMany(Order, { foreignKey: 'promo_code_id' });

PromoCode.hasMany(PromoCodeUsage, { foreignKey: 'promo_code_id', onDelete: 'CASCADE' });
PromoCodeUsage.belongsTo(PromoCode, { foreignKey: 'promo_code_id' });
Order.hasOne(PromoCodeUsage, { foreignKey: 'order_id' });
PromoCodeUsage.belongsTo(Order, { foreignKey: 'order_id' });
User.hasMany(PromoCodeUsage, { foreignKey: 'user_id', onDelete: 'CASCADE' });
PromoCodeUsage.belongsTo(User, { foreignKey: 'user_id' });

// Notifications
User.hasMany(Notification, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

// DeliveryAssignment
Order.hasOne(DeliveryAssignment, { foreignKey: 'order_id', onDelete: 'CASCADE' });
DeliveryAssignment.belongsTo(Order, { foreignKey: 'order_id' });
User.hasMany(DeliveryAssignment, { foreignKey: 'agent_id', onDelete: 'CASCADE' });
DeliveryAssignment.belongsTo(User, { foreignKey: 'agent_id', as: 'agent' }); // ✅ add alias

// Review ↔ User (already exists, but ensure alias)
Review.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });
User.hasMany(Review, { foreignKey: 'customer_id' });

// Product ↔ Review (polymorphic, scope to products)
Product.hasMany(Review, {
  foreignKey: 'target_id',
  constraints: false,
  scope: { target_type: 'product' },
  as: 'Reviews'
});
Review.belongsTo(Product, {
  foreignKey: 'target_id',
  constraints: false,
  as: 'product'
});
// ReferralReward
User.hasMany(ReferralReward, { foreignKey: 'referrer_id', onDelete: 'CASCADE' });
User.hasMany(ReferralReward, { foreignKey: 'referred_user_id', onDelete: 'CASCADE' });
ReferralReward.belongsTo(User, { foreignKey: 'referrer_id' });
ReferralReward.belongsTo(User, { foreignKey: 'referred_user_id' });

module.exports = {
  sequelize,
  User,
  TraderProfile,
  Category,
  Product,
  PriceTableItem,
  Market,
  MarketMembership,
  Order,
  OrderItem,
  CartItem,
  Loyalty,
  PromoCode,
  PromoCodeUsage,
  Notification,
  DeliveryAssignment,
  Review,
  Advertisement,
  ReferralReward,
  AppSetting
};
