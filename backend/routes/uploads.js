const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const uploadFolder = path.join(__dirname, '..', 'uploads');

// Ensure upload folder exists
fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${uniqueSuffix}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const isValidMime = allowedTypes.test(file.mimetype);
    if (isValidExt && isValidMime) cb(null, true);
    else cb(new Error('Only JPEG, PNG or WEBP images are allowed.'));
  },
});

// Handle multer errors and process upload
router.post(
  '/',
  (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
      }
      if (err) {
        return res.status(400).json({ success: false, error: err.message || 'File upload failed' });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, data: { image_url: imageUrl } });
  }
);

module.exports = router;
