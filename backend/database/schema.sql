-- ============================================================
--  Rohini Foods India — Database Schema
--  Run this file in your MySQL server to set up the database.
--  Example (terminal):
--    mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS rohini_foods
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE rohini_foods;

-- ------------------------------------------------------------
--  PRODUCTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  price       FLOAT NOT NULL,
  image_url   VARCHAR(500),
  category    VARCHAR(80) DEFAULT 'Pickles',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
--  CONTACTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
--  ORDERS TABLES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  phone         VARCHAR(30) NOT NULL,
  address       VARCHAR(300) NOT NULL,
  total_amount  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status        ENUM('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT NOT NULL,
  product_id   INT NULL,
  product_name VARCHAR(150) NOT NULL,
  price        DECIMAL(10,2) NOT NULL,
  qty          INT NOT NULL DEFAULT 1,
  image_url    VARCHAR(500),
  category     VARCHAR(80),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  SEED DATA — sample products
-- ------------------------------------------------------------
INSERT INTO products (name, description, price, image_url, category) VALUES
('Mango Aachar',
 'A classic North Indian mango pickle made with raw Alphonso mangoes, mustard oil, and hand-ground spices. Sun-cured the traditional way.',
 249.00,
 'product.heic',
 'Pickles'),

('Lemon Aachar',
 'Tangy, bright, and full of zing. Fresh lemons slow-cured with rock salt, fenugreek, and a whisper of asafoetida.',
 199.00,
 'https://images.unsplash.com/photo-1589533610925-1cffc309ebcd?w=800',
 'Pickles'),

('Green Chilli Aachar',
 'For the brave-hearted. Plump green chillies packed with mustard seeds and mustard oil — fiery, flavourful, unforgettable.',
 229.00,
 'https://images.unsplash.com/photo-1599909533730-ed5e19e1ec92?w=800',
 'Pickles'),

('Mixed Vegetable Aachar',
 'A celebration of the season — carrots, cauliflower, turnip, and green chillies pickled in warm, aromatic spices.',
 269.00,
 'https://images.unsplash.com/photo-1571950006418-f226dc106482?w=800',
 'Pickles'),

('Garlic Aachar',
 'Peeled garlic pods mellowed in mustard oil with red chilli powder and hing. A powerful, warming pickle.',
 239.00,
 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800',
 'Pickles'),

('Homemade Ghee',
 'Pure cow ghee, slow-churned from cultured cream. Golden, nutty, and made in small batches.',
 599.00,
 'https://images.unsplash.com/photo-1628689469838-524a4a973b8e?w=800',
 'Homemade'),

('Masala Papad',
 'Hand-rolled, sun-dried papads seasoned with cracked pepper and cumin. Fry or roast — both delicious.',
 149.00,
 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800',
 'Homemade'),

('Gunpowder Chutney',
 'The iconic South Indian molagapodi — roasted lentils, sesame, red chillies. Sprinkle over idlis with ghee.',
 179.00,
 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800',
 'Homemade');
