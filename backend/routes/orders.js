const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { body, param, validationResult } = require('express-validator');

const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

// ---------------------------------------------------------
// POST /api/orders  —  place a new order
// ---------------------------------------------------------
router.post(
  '/',
  [
    body('customer_name').trim().notEmpty().withMessage('Customer name is required').isLength({ max: 120 }),
    body('phone').trim().notEmpty().withMessage('Phone is required').isLength({ max: 30 }),
    body('address').trim().notEmpty().withMessage('Address is required').isLength({ max: 300 }),
    body('items').isArray({ min: 1 }).withMessage('At least one order item is required'),
    body('items.*.product_id').optional().isInt(),
    body('items.*.name').trim().notEmpty().withMessage('Item name is required'),
    body('items.*.price').isFloat({ min: 0 }).withMessage('Item price must be valid'),
    body('items.*.qty').isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
    body('items.*.image_url').optional().trim(),
    body('items.*.category').optional().trim(),
    body('total_amount').optional().isFloat({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { customer_name, phone, address, items } = req.body;
    const computedTotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
    const total_amount =
      typeof req.body.total_amount === 'number' ? Number(req.body.total_amount) : Number(computedTotal.toFixed(2));

    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();

      const [orderResult] = await conn.query(
        `INSERT INTO orders (customer_name, phone, address, total_amount, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [customer_name, phone, address, total_amount]
      );

      const orderId = orderResult.insertId;
      const itemValues = items.map((item) => [
        orderId,
        item.product_id || null,
        item.name,
        Number(item.price),
        Number(item.qty),
        item.image_url || '',
        item.category || '',
      ]);

      await conn.query(
        `INSERT INTO order_items
          (order_id, product_id, product_name, price, qty, image_url, category)
         VALUES ?`,
        [itemValues]
      );

      await conn.commit();
      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: { id: orderId, status: 'pending', total_amount },
      });
    } catch (err) {
      if (conn) await conn.rollback();
      console.error(err);
      res.status(500).json({ success: false, error: 'Failed to place order' });
    } finally {
      if (conn) conn.release();
    }
  }
);

// ---------------------------------------------------------
// GET /api/orders  —  admin: list all orders with items
// ---------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    if (!orders.length) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const ids = orders.map((o) => o.id);
    const [items] = await db.query(
      `SELECT id, order_id, product_id, product_name, price, qty, image_url, category
       FROM order_items
       WHERE order_id IN (?)
       ORDER BY id ASC`,
      [ids]
    );

    const itemsByOrderId = new Map();
    items.forEach((item) => {
      if (!itemsByOrderId.has(item.order_id)) itemsByOrderId.set(item.order_id, []);
      itemsByOrderId.get(item.order_id).push(item);
    });

    const data = orders.map((order) => ({
      ...order,
      items: itemsByOrderId.get(order.id) || [],
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// ---------------------------------------------------------
// PUT /api/orders/:id/status  —  admin: update order status
// ---------------------------------------------------------
router.put(
  '/:id/status',
  [
    param('id').isInt().withMessage('Valid order id required'),
    body('status').isIn(ORDER_STATUSES).withMessage('Invalid order status'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      res.json({ success: true, message: 'Order status updated' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Failed to update order status' });
    }
  }
);

// ---------------------------------------------------------
// DELETE /api/orders/:id  —  admin: delete order
// ---------------------------------------------------------
router.delete('/:id', param('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const [result] = await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete order' });
  }
});

module.exports = router;
