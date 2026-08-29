const QRCode = require('qrcode');

exports.generateQR = async (text) => {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    throw new Error('QR generation failed');
  }
};