const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { body, param, validationResult } = require('express-validator');

// ---------------------------------------------------------
// GET /api/products  —  list all products
// ---------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY id ASC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// ---------------------------------------------------------
// GET /api/products/:id  —  single product
// ---------------------------------------------------------
router.get('/:id', param('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0)
      return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

// ---------------------------------------------------------
// POST /api/products  —  admin: add product
// ---------------------------------------------------------
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
    body('description').optional().trim(),
    body('image_url').optional().trim(),
    body('category').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const { name, description, price, image_url, category } = req.body;
    try {
      const [result] = await db.query(
        'INSERT INTO products (name, description, price, image_url, category) VALUES (?, ?, ?, ?, ?)',
        [name, description || '', price, image_url || '', category || 'Pickles']
      );
      res.status(201).json({
        success: true,
        message: 'Product added',
        data: { id: result.insertId, name, description, price, image_url, category },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Failed to add product' });
    }
  }
);

// ---------------------------------------------------------
// PUT /api/products/:id  —  admin: update product
// ---------------------------------------------------------
router.put('/:id', param('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { name, description, price, image_url, category } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, category = ? WHERE id = ?',
      [name, description, price, image_url, category, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, message: 'Product updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

// ---------------------------------------------------------
// DELETE /api/products/:id  —  admin: delete product
// ---------------------------------------------------------
router.delete('/:id', param('id').isInt(), async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

module.exports = router;
