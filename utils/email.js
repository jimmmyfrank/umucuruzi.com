const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendEmail = async (to, subject, html, text = '') => {
  try {
    const info = await transporter.sendMail({
      from: `"Umucuruzi" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    return info;
  } catch (err) {
    console.error('Email send error:', err);
    throw err;
  }
};