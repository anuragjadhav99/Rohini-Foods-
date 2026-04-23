# 🫙 Rohini Foods India — Full-Stack Website

A warm, editorial, full-stack website for **Rohini Foods India** — built with vanilla HTML/CSS/JS on the frontend, Node.js + Express on the backend, and MySQL for data storage.

**Tagline:** *Where Taste Meets Nutrition*

---

## ✨ Features

### Frontend
- 🏠 **Home** — hero, tagline, product highlights, featured products, marquee band
- 📖 **About Us** — brand story, values, CTA
- 🫙 **Products** — category filters, product cards, cart (localStorage)
- ✉️ **Contact** — form (posts to API), contact details, Google Maps embed
- 📱 **Fully responsive** — mobile, tablet, desktop
- ✨ **Smooth animations** — scroll reveals, staggered hero, hover effects
- 💬 **Floating WhatsApp button** with pulse animation
- 🔍 **SEO optimized** with meta tags and descriptions
- 📌 **Sticky navbar** with scroll shadow

### Backend
- `GET    /api/products`       — list all products
- `GET    /api/products/:id`   — single product
- `POST   /api/products`       — admin: add product
- `PUT    /api/products/:id`   — admin: update product
- `DELETE /api/products/:id`   — admin: delete product
- `POST   /api/contacts`       — submit contact form (stores in DB)
- `GET    /api/contacts`       — admin: list submissions
- `GET    /api/health`         — health check

### Database (MySQL)
- **products** — id, name, description, price, image_url, category, created_at
- **contacts** — id, name, email, message, created_at

---

## 📂 Project Structure

```
rohini-foods-india/
├── backend/
│   ├── config/database.js      # MySQL connection pool
│   ├── database/schema.sql     # DB schema + seed data
│   ├── routes/
│   │   ├── products.js         # Product CRUD routes
│   │   └── contacts.js         # Contact form routes
│   ├── .env.example            # Environment variable template
│   ├── package.json
│   └── server.js               # Express server entry point
├── frontend/
│   ├── css/style.css           # Design system + components
│   ├── js/
│   │   ├── main.js             # Navbar, reveals
│   │   ├── products.js         # Product fetch, filter, cart
│   │   └── contact.js          # Contact form submit
│   ├── index.html              # Home
│   ├── about.html              # About Us
│   ├── products.html           # Products
│   └── contact.html            # Contact
└── README.md
```

---

## 🚀 Setup Instructions (Local)

### 1. Prerequisites
- **Node.js** v18+
- **MySQL** 8.0+ (or MariaDB)
- A text editor (VS Code recommended)

### 2. Clone / unzip the project

```bash
cd rohini-foods-india
```

### 3. Set up the database

Start your MySQL server, then run the schema file:

```bash
mysql -u root -p < backend/database/schema.sql
```

This creates the `rohini_foods` database with the `products` and `contacts` tables, and seeds 8 sample products.

### 4. Configure backend env

```bash
cd backend
cp .env.example .env
```

Open `.env` and set your MySQL password:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=rohini_foods
DB_PORT=3306
```

### 5. Install & run the backend

```bash
npm install
npm start        # or: npm run dev (auto-reload with nodemon)
```

You should see:

```
✅ Connected to MySQL database: rohini_foods
🌿 Rohini Foods server running at http://localhost:5000
```

### 6. Open the frontend

You have **two options**:

**Option A — Open directly (simple)**
The backend already serves the frontend as static files. Just open:

```
http://localhost:5000
```

**Option B — Live Server (for frontend dev)**
If you prefer editing frontend files with auto-reload, use VS Code's **Live Server** extension on `frontend/index.html`. The pages will hit `http://localhost:5000/api` automatically (the JS detects localhost).

---

## 🛠 API Usage Examples

### Get all products
```bash
curl http://localhost:5000/api/products
```

### Add a product (admin)
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Red Chilli Pickle","description":"Fiery & fresh","price":209,"image_url":"https://example.com/img.jpg","category":"Pickles"}'
```

### Submit a contact message
```bash
curl -X POST http://localhost:5000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"Priya","email":"priya@example.com","message":"Hi! Do you ship to Bangalore?"}'
```

---

## 🎨 Design System

- **Colors:** cream (`#faf4e6`), forest green (`#1f3a1f`), turmeric (`#d97706`), chili (`#9b2226`)
- **Typography:** Fraunces (display, with soft + wonk axes for handmade feel) + Nunito (body)
- **Motion:** scroll-triggered reveals, staggered hero load, floating badges, marquee band
- **Icons:** inline SVG throughout — zero icon dependencies

---

## 📦 Tech Stack

| Layer     | Tech                                      |
|-----------|-------------------------------------------|
| Frontend  | HTML5, CSS3 (custom design system), Vanilla JS |
| Backend   | Node.js, Express.js, express-validator    |
| Database  | MySQL (mysql2 driver w/ connection pool)  |
| Fonts     | Google Fonts (Fraunces, Nunito)           |

---

## 🌐 Social Links

- Instagram: [@rohinifoodsindia](https://www.instagram.com/rohinifoodsindia)
- WhatsApp: update the phone number in `+919999999999` across HTML files
- Facebook: add your page URL in footer `<a>` tags

---

## 🔧 Customisation tips

- **Change colors:** edit the `:root` variables at the top of `frontend/css/style.css`
- **Change fonts:** update the Google Fonts `<link>` and `--font-display` / `--font-body` vars
- **Add products:** either insert rows via MySQL, or `POST /api/products`
- **Deploy:** backend → Render/Railway/Heroku; frontend → served by backend or Netlify/Vercel
- **SEO:** add your real business info, structured data (JSON-LD), and sitemap.xml

---

## 📄 License

Built for Rohini Foods India. Feel free to customise & use.

Made with love & mustard oil 🫙
