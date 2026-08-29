// models/Notification.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('email', 'sms', 'push'),
      defaultValue: 'push',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'notifications',
    timestamps: false,
    updatedAt: false,
  });

  // ─── Helper: create notification ──────────────────────────────────
  Notification.createNotification = async (userId, title, message, type = 'push', data = {}) => {
    try {
      // Save to DB
      await Notification.create({
        user_id: userId,
        type,
        title,
        message,
        is_read: false,
        created_at: new Date(),
      });

      // Try sending push notification
      try {
        const { sendPushNotification } = require('../utils/sendPushNotification');
        await sendPushNotification(userId, title, message, data);
      } catch (pushErr) {
        console.warn('Push not sent:', pushErr.message);
      }
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  };

  return Notification;
};