const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { body, validationResult } = require('express-validator');

// ---------------------------------------------------------
// POST /api/contacts  —  save a contact form submission
// ---------------------------------------------------------
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const { name, email, message } = req.body;
    try {
      const [result] = await db.query(
        'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
        [name, email, message]
      );
      res.status(201).json({
        success: true,
        message: 'Thank you! We will get back to you soon.',
        data: { id: result.insertId },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Failed to save message' });
    }
  }
);

// ---------------------------------------------------------
// GET /api/contacts  —  admin: list all submissions
// ---------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch contacts' });
  }
});

module.exports = router;
