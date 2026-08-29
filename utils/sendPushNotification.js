// utils/sendPushNotification.js
const { Expo } = require('expo-server-sdk');
const { User } = require('../models');

// Create a new Expo SDK client
const expo = new Expo();

const sendPushNotification = async (userId, title, message, data = {}) => {
  try {
    const user = await User.findByPk(userId);
    if (!user || !user.push_token) return;

    // Check if the token is a valid Expo push token
    if (!Expo.isExpoPushToken(user.push_token)) {
      console.error(`Invalid Expo push token: ${user.push_token}`);
      return;
    }

    const messages = [{
      to: user.push_token,
      sound: 'default',
      title,
      body: message,
      data,
    }];

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }
    return tickets;
  } catch (err) {
    console.error('Error sending push notification:', err);
  }
};

module.exports = { sendPushNotification };