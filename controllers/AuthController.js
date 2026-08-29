const { User, TraderProfile, ReferralReward, Notification } = require('../models');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { signToken } = require('../utils/jwt');
const { generateReferralCode } = require('../utils/referral');
const { generateQR } = require('../utils/qr');
const { sendEmail } = require('../utils/email');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Helper: create notification
const createNotification = async (userId, type, title, message) => {
  await Notification.create({ user_id: userId, type, title, message });
};

// ---------- SIGNUP ----------
exports.signup = async (req, res) => {
  try {
    const { full_name, username, email, phone, password, role, profile_image, description } = req.body;

    // --- Validation ---
    if (!full_name || !username || !phone || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!['customer', 'trader', 'agent'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // --- Check duplicates (specific field) ---
    let conflictField = null;
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) conflictField = 'username';

    if (!conflictField && email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) conflictField = 'email';
    }

    if (!conflictField) {
      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) conflictField = 'phone';
    }

    if (conflictField) {
      return res.status(409).json({
        error: `The ${conflictField} is already taken. Please use a different one.`
      });
    }

    // --- Handle profile image (base64) ---
    let profileImagePath = null;
    if (profile_image) {
      try {
        let base64String = profile_image;
        let fileExtension = 'jpg'; // default

        // Check if it's a data URL (starts with "data:image")
        if (profile_image.startsWith('data:image')) {
          // Extract mime type and base64 data
          const matches = profile_image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            fileExtension = matches[1];
            base64String = matches[2];
          } else {
            // Fallback: split at comma
            const parts = profile_image.split(',');
            if (parts.length === 2) {
              const mimeMatch = parts[0].match(/^data:image\/([a-zA-Z]+);base64$/);
              if (mimeMatch) {
                fileExtension = mimeMatch[1];
              }
              base64String = parts[1];
            }
          }
        } else {
          // Assume raw base64 – try to detect image type from magic bytes
          // (optional: you can detect by reading first few chars, but we'll just use .jpg)
          fileExtension = 'jpg';
        }

        // Decode base64 to binary buffer
        const buffer = Buffer.from(base64String, 'base64');

        // Limit file size to 2MB
        if (buffer.length > 2 * 1024 * 1024) {
          return res.status(400).json({ error: 'Image too large (max 2MB)' });
        }

        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const filename = `profile-${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExtension}`;
        const filePath = path.join(uploadsDir, filename);

        // Write file
        fs.writeFileSync(filePath, buffer);

        // Store relative URL path for database
        profileImagePath = `/uploads/${filename}`;
      } catch (imageError) {
        console.error('Image processing error:', imageError);
        // Continue without image – don't block signup
        profileImagePath = null;
      }
    }

    // --- Create user ---
    const hashed = await hashPassword(password);
    const referralCode = generateReferralCode();

    const user = await User.create({
      full_name,
      username,
      email: email || null,
      phone,
      password_hash: hashed,
      role,
      referral_code: referralCode,
      profile_image: profileImagePath, // store relative path
      description: description || null,
    });

    // --- If trader, create a minimal trader profile ---
    if (role === 'trader') {
      await TraderProfile.create({
        user_id: user.id,
        shop_name: `${full_name}'s Shop`,
        is_paid: true,
      });
    }

    // --- Generate token ---
    const token = signToken(user);

    // --- Response ---
    const userData = user.toJSON();
    delete userData.password_hash;

    res.status(201).json({
      token,
      user: userData,
    });
  } catch (err) {
    console.error('❌ Signup error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// ---------- LOGIN ----------
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('🔍 Login attempt for:', username);

    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      console.log('⚠️ User is disabled');
      return res.status(403).json({ error: 'Account disabled' });
    }

    const bcrypt = require('bcryptjs');
    const match = await bcrypt.compare(password, user.password_hash);
    console.log('🔑 Password match:', match);

    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    const userData = user.toJSON();
    delete userData.password_hash;

    res.json({ token, user: userData });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// ---------- GOOGLE AUTH (placeholder) ----------
exports.googleAuth = async (req, res) => {
  res.status(501).json({ error: 'Google auth not implemented yet' });
};

// ---------- GENERATE TRADER QR ----------
exports.generateTraderQR = async (req, res) => {
  try {
    const traderId = req.params.traderId;
    const trader = await User.findByPk(traderId);
    if (!trader || trader.role !== 'trader') {
      return res.status(404).json({ error: 'Trader not found' });
    }
    const url = `${process.env.QR_BASE_URL}/api/trader/${traderId}`;
    const qr = await generateQR(url);
    res.json({ qr });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'QR generation failed' });
  }
};