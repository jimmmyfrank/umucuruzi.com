const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('./models');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS – allow all origins for development
app.use(cors({
  origin: '*', // Allow any origin (for development)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(helmet({ crossOriginResourcePolicy: false })); // Disable cross-origin restrictions
app.use(express.json({ limit: '50mb' }));
// ... existing imports
const { User } = require('./models'); // make sure to import your User model
const bcrypt = require('bcryptjs');

// PUBLIC DEBUG ENDPOINT (No middleware protection!)
app.post('/api/debug-login', async (req, res) => {
  const { username, password } = req.body;
  console.log("Debug attempt received:", username);
  
  const user = await User.findOne({ where: { username } });
  if (!user) return res.json({ message: "❌ User not found in DB", userFound: false });

  const valid = await bcrypt.compare(password, user.password_hash);
  res.json({ 
    userFound: true, 
    role: user.role, 
    passwordMatches: valid,
    activeStatus: user.is_active
  });
});
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files with explicit CORS headers
// In server.js, after app.use(cors())
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/ads', require('./routes/adRoutes'));
app.use('/api', require('./routes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/ads', require('./routes/adRoutes'));
app.use('/api/markets', require('./routes/marketRoutes'));
app.use('/api/loyalty', require('./routes/loyaltyRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));


app.get('/', (req, res) => res.send('Umucuruzi API is running'));

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

sequelize.sync({ alter: false })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📁 Uploads directory: ${uploadDir}`);
    });
  })
  .catch(err => console.error('DB connection failed:', err));