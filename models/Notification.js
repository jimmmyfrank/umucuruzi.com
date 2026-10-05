// models/Notification.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
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

      // ── NEW: lets the mobile app route on tap ───────────────
      // related_type = 'trader' (or 'order', 'product', …)
      // related_id   = the primary key of that entity
      related_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      related_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // ────────────────────────────────────────────────────────

      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'notifications',
      timestamps: false,
      updatedAt: false,
    }
  );

  /* ─── Helper: create a notification and try to push it ───
     Extra optional args:
       relatedType, relatedId — used to build deep links on the
       client so tapping the notification opens the right screen.
  */
  Notification.createNotification = async (
    userId,
    title,
    message,
    type = 'push',
    data = {}
  ) => {
    try {
      await Notification.create({
        user_id: userId,
        type,
        title,
        message,
        related_type: data.related_type || null,
        related_id: data.related_id || null,
        is_read: false,
        created_at: new Date(),
      });

      // Best-effort push
      try {
        const { sendPushNotification } = require('../utils/sendPushNotification');
        await sendPushNotification(userId, title, message, {
          ...data,
          related_type: data.related_type,
          related_id: data.related_id,
        });
      } catch (pushErr) {
        console.warn('Push not sent:', pushErr.message);
      }
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  };

  return Notification;
};
