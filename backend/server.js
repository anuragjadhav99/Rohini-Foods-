const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const productsRoutes = require('./routes/products');
const contactsRoutes = require('./routes/contacts');
const ordersRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend (optional — lets backend serve the site too)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---------- API Routes ----------
app.use('/api/products', productsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/orders', ordersRoutes);

// Health-check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Rohini Foods India API', time: new Date().toISOString() });
});

// ---------- SPA fallback (optional) ----------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong' });
});

// ---------- Start server ----------
const server = app.listen(PORT, () => {
  console.log(`🌿 Rohini Foods server running at http://localhost:${PORT}`);
  console.log(`   API available at http://localhost:${PORT}/api`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Stop the existing server or set a different PORT in backend/.env.`);
    process.exit(1);
  }

  throw err;
});
