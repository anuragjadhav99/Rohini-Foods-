/* =====================================================
   ROHINI FOODS INDIA — cart.js
   Marketplace-style cart page interactions
   ===================================================== */

function getCart() {
  try {
    return JSON.parse(localStorage.getItem('rf_cart') || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('rf_cart', JSON.stringify(cart));
}

function currency(value) {
  return `₹${Number(value).toFixed(0)}`;
}

const API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

function updateCartCount() {
  const el = document.getElementById('cartCount');
  if (!el) return;
  const qty = getCart().reduce((sum, item) => sum + (item.qty || 0), 0);
  el.textContent = qty;
}

function calculateSummary(cart) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const qty = cart.reduce((sum, item) => sum + item.qty, 0);
  const delivery = subtotal > 0 ? 40 : 0;
  const discount = subtotal >= 1000 ? Math.round(subtotal * 0.08) : 0;
  const total = subtotal + delivery - discount;
  return { subtotal, qty, delivery, discount, total };
}

function renderSummary(cart) {
  const { subtotal, qty, delivery, discount, total } = calculateSummary(cart);
  const summaryQty = document.getElementById('summaryQty');
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryDelivery = document.getElementById('summaryDelivery');
  const summaryDiscount = document.getElementById('summaryDiscount');
  const summaryTotal = document.getElementById('summaryTotal');

  if (summaryQty) summaryQty.textContent = String(qty);
  if (summarySubtotal) summarySubtotal.textContent = currency(subtotal);
  if (summaryDelivery) summaryDelivery.textContent = currency(delivery);
  if (summaryDiscount) summaryDiscount.textContent = `- ${currency(discount)}`;
  if (summaryTotal) summaryTotal.textContent = currency(total);
}

function renderCart() {
  const cartItems = document.getElementById('cartItems');
  if (!cartItems) return;

  const cart = getCart();
  if (!cart.length) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <h3>Your cart is empty</h3>
        <p>Add your favorite products to continue shopping.</p>
        <a href="products.html" class="btn btn-primary">Browse Products</a>
      </div>
    `;
    renderSummary(cart);
    updateCartCount();
    return;
  }

  cartItems.innerHTML = cart.map((item) => `
    <article class="cart-item">
      <div class="cart-item-image">
        <img src="${item.image_url || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500'}" alt="${item.name}" />
      </div>
      <div class="cart-item-main">
        <h3>${item.name}</h3>
        <p>Category: ${item.category || 'Homemade Essentials'}</p>
        <div class="cart-item-price">${currency(item.price)}</div>
        <div class="cart-item-actions">
          <div class="qty-control" data-id="${item.id}">
            <button class="qty-btn" data-action="decrease" aria-label="Decrease quantity">-</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-action="increase" aria-label="Increase quantity">+</button>
          </div>
          <button class="text-action" data-action="remove" data-id="${item.id}">Remove</button>
          <button class="text-action" data-action="save">Save for later</button>
        </div>
      </div>
      <div class="cart-item-total">${currency(item.price * item.qty)}</div>
    </article>
  `).join('');

  renderSummary(cart);
  updateCartCount();
  attachCartEvents();
}

function attachCartEvents() {
  const cartItems = document.getElementById('cartItems');
  if (!cartItems) return;

  cartItems.querySelectorAll('.qty-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrapper = btn.closest('.qty-control');
      if (!wrapper) return;
      const id = Number(wrapper.dataset.id);
      const action = btn.dataset.action;

      const cart = getCart();
      const target = cart.find((it) => it.id === id);
      if (!target) return;

      if (action === 'increase') target.qty += 1;
      if (action === 'decrease') target.qty = Math.max(1, target.qty - 1);

      saveCart(cart);
      renderCart();
    });
  });

  cartItems.querySelectorAll('.text-action[data-action="remove"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const next = getCart().filter((it) => it.id !== id);
      saveCart(next);
      renderCart();
    });
  });

  cartItems.querySelectorAll('.text-action[data-action="save"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      alert('Saved for later feature can be connected to backend wishlist next.');
    });
  });
}

document.getElementById('placeOrderBtn')?.addEventListener('click', async () => {
  const cart = getCart();
  if (!cart.length) {
    alert('Your cart is empty. Add products first.');
    return;
  }

  const customer_name = window.prompt('Enter your name for this order:');
  if (!customer_name || !customer_name.trim()) return;

  const phone = window.prompt('Enter your phone number:');
  if (!phone || !phone.trim()) return;

  const address = window.prompt('Enter delivery address:');
  if (!address || !address.trim()) return;

  const { total } = calculateSummary(cart);
  const items = cart.map((item) => ({
    product_id: item.id,
    name: item.name,
    price: item.price,
    qty: item.qty,
    image_url: item.image_url || '',
    category: item.category || '',
  }));

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: customer_name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        total_amount: total,
        items,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Could not place order');
    }

    localStorage.removeItem('rf_cart');
    renderCart();
    alert(`Order #${json.data.id} placed for ${currency(total)}.\n\nThank you for shopping with Rohini Foods India.`);
  } catch (err) {
    alert(`Unable to place order right now.\n${err.message}`);
  }
});

renderCart();
