const twilio = require('twilio');

const client = twilio(
  process.env.SMS_ACCOUNT_SID,
  process.env.SMS_AUTH_TOKEN
);

exports.sendSMS = async (to, body) => {
  try {
    const message = await client.messages.create({
      body,
      from: process.env.SMS_FROM,
      to
    });
    return message;
  } catch (err) {
    console.error('SMS send error:', err);
    throw err;
  }
};