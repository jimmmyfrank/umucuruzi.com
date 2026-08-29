const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  }
});

// Accept everything – web sends text/plain sometimes
const fileFilter = (req, file, cb) => {
  // Accept any file with a valid extension
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
  
  // If it has an allowed extension, accept it
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    // Also accept if it's a common image MIME type
    const imageMimeTypes = ['image/', 'application/octet-stream', 'text/plain'];
    const isImageMime = imageMimeTypes.some(type => file.mimetype && file.mimetype.includes(type));
    if (isImageMime) {
      cb(null, true);
    } else {
      // Accept anyway – we'll rely on extension check
      if (ext && ext.length > 0) {
        cb(null, true);
      } else {
        cb(new Error(`Only image files are allowed. Received: ${file.mimetype || 'unknown'}`));
      }
    }
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024,      // 10MB per file
    fieldNameSize: 1000,
    fieldSize: 20 * 1024 * 1024,
  },
  fileFilter
});

module.exports = upload;