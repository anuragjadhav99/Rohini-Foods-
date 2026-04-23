/* =====================================================
   ROHINI FOODS INDIA — products.js
   Fetches products from backend API, renders cards,
   filters by category, handles cart (localStorage).
   ===================================================== */

// Switch to your deployed API URL in production
const API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

// Fallback data used if backend is unreachable (keeps the page alive during dev)
const FALLBACK_PRODUCTS = [
  { id: 1, name: 'Mango Aachar', description: "Classic mango pickle in mustard oil with hand-ground spices. Sun-cured traditionally.", price: 249, image_url: 'product.heic', category: 'Pickles' },
  { id: 2, name: 'Lemon Aachar', description: 'Tangy, bright, and full of zing. Lemons slow-cured with rock salt & fenugreek.', price: 199, image_url: 'https://images.unsplash.com/photo-1589533610925-1cffc309ebcd?w=800', category: 'Pickles' },
  { id: 3, name: 'Green Chilli Aachar', description: 'Plump chillies with mustard seeds and mustard oil. Fiery & unforgettable.', price: 229, image_url: 'https://images.unsplash.com/photo-1599909533730-ed5e19e1ec92?w=800', category: 'Pickles' },
  { id: 4, name: 'Mixed Vegetable Aachar', description: 'Carrots, cauliflower, turnip, and chillies in aromatic spices.', price: 269, image_url: 'https://images.unsplash.com/photo-1571950006418-f226dc106482?w=800', category: 'Pickles' },
  { id: 5, name: 'Garlic Aachar', description: 'Garlic pods in mustard oil with red chilli and asafoetida. Warming & powerful.', price: 239, image_url: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800', category: 'Pickles' },
  { id: 6, name: 'Homemade Ghee', description: 'Pure cow ghee, slow-churned from cultured cream. Golden and nutty.', price: 599, image_url: 'https://images.unsplash.com/photo-1628689469838-524a4a973b8e?w=800', category: 'Homemade' },
  { id: 7, name: 'Masala Papad', description: 'Hand-rolled, sun-dried papads with cracked pepper and cumin.', price: 149, image_url: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800', category: 'Homemade' },
  { id: 8, name: 'Gunpowder Chutney', description: 'Molagapodi — roasted lentils, sesame, red chillies. Sprinkle over idlis.', price: 179, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800', category: 'Homemade' },
];

let allProducts = [];
let activeFilter = 'all';

// ---------- Fetch products from API ----------
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('API error');
    const json = await res.json();
    allProducts = json.data || [];
  } catch (err) {
    console.warn('Using fallback product data —', err.message);
    allProducts = FALLBACK_PRODUCTS;
  }

  // Render on whichever grid exists
  renderProducts();
}

// ---------- Render ----------
function renderProducts() {
  const featured = document.getElementById('featuredProducts');
  const fullGrid = document.getElementById('productGrid');

  if (featured) {
    // Show first 4 as featured on home
    featured.innerHTML = allProducts.slice(0, 4).map(productCard).join('');
    attachCartHandlers(featured);
  }

  if (fullGrid) {
    const list =
      activeFilter === 'all'
        ? allProducts
        : allProducts.filter((p) => p.category === activeFilter);
    fullGrid.innerHTML = list.map(productCard).join('');
    attachCartHandlers(fullGrid);
  }
}

function productCard(p) {
  const desc = p.description || '';
  const shortDesc = desc.length > 95 ? desc.slice(0, 95) + '…' : desc;
  return `
    <article class="product-card reveal visible" data-category="${p.category || ''}">
      <div class="img-wrap">
        ${p.category ? `<span class="tag">${p.category}</span>` : ''}
        <img src="${p.image_url}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p>${shortDesc}</p>
        <div class="product-footer">
          <span class="product-price"><span class="currency">₹</span>${Number(p.price).toFixed(0)}</span>
          <button class="btn-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.image_url || ''}" data-category="${p.category || ''}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2l1 4h14l-2 10H9L7 4"/><circle cx="10" cy="21" r="1.5"/><circle cx="18" cy="21" r="1.5"/></svg>
            Add
          </button>
        </div>
      </div>
    </article>`;
}

// ---------- Filter pills (products.html) ----------
document.querySelectorAll('.filter-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    activeFilter = pill.dataset.filter;
    renderProducts();
  });
});

// ---------- Simple cart (localStorage) ----------
function getCart() {
  try {
    return JSON.parse(localStorage.getItem('rf_cart') || '[]');
  } catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem('rf_cart', JSON.stringify(cart));
  updateCartCount();
}
function updateCartCount() {
  const el = document.getElementById('cartCount');
  if (el) el.textContent = getCart().reduce((a, b) => a + b.qty, 0);
}
function attachCartHandlers(container) {
  container.querySelectorAll('.btn-cart').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = +btn.dataset.id;
      const cart = getCart();
      const existing = cart.find((c) => c.id === id);
      if (existing) existing.qty += 1;
      else {
        cart.push({
          id,
          name: btn.dataset.name,
          price: +btn.dataset.price,
          qty: 1,
          image_url: btn.dataset.image || '',
          category: btn.dataset.category || '',
        });
      }
      saveCart(cart);

      // quick visual feedback
      const original = btn.innerHTML;
      btn.innerHTML = '✓ Added';
      btn.style.background = 'var(--turmeric)';
      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.background = '';
      }, 1200);
    });
  });
}

// ---------- Cart button opens cart page ----------
document.getElementById('cartBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'cart.html';
});

// ---------- Go ----------
updateCartCount();
loadProducts();
