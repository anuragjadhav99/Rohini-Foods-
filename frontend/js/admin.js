const API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

const ADMIN_EMAIL = 'anuragjadhav684@gmail.com';
const productForm = document.getElementById('productForm');
const productMsg = document.getElementById('adminMsg');
const productsTableBody = document.querySelector('#productsTable tbody');
const ordersTableBody = document.querySelector('#ordersTable tbody');

let products = [];
let orders = [];

function showMsg(text, kind = 'success') {
  productMsg.className = `form-msg ${kind}`;
  productMsg.textContent = text;
}

function ensureAdminAccess() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('rf_user') || 'null');
  } catch {
    user = null;
  }
  if (!user || user.email !== ADMIN_EMAIL) {
    alert('Please login with admin credentials to access admin panel.');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products`);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load products');
  products = json.data || [];
  renderProducts();
}

function renderProducts() {
  if (!productsTableBody) return;
  productsTableBody.innerHTML = products
    .map(
      (p) => `
      <tr>
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>₹${Number(p.price).toFixed(0)}</td>
        <td>${p.category || '-'}</td>
        <td>
          <button class="table-btn" data-action="edit-product" data-id="${p.id}">Edit</button>
          <button class="table-btn danger" data-action="delete-product" data-id="${p.id}">Delete</button>
        </td>
      </tr>
    `
    )
    .join('');
}

function fillProductForm(product) {
  document.getElementById('productId').value = product.id || '';
  document.getElementById('productName').value = product.name || '';
  document.getElementById('productPrice').value = product.price || 0;
  document.getElementById('productCategory').value = product.category || '';
  document.getElementById('productImage').value = product.image_url || '';
  document.getElementById('productDescription').value = product.description || '';
}

function resetProductForm() {
  productForm.reset();
  document.getElementById('productId').value = '';
}

async function upsertProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const payload = {
    name: document.getElementById('productName').value.trim(),
    price: Number(document.getElementById('productPrice').value),
    category: document.getElementById('productCategory').value.trim() || 'Pickles',
    image_url: document.getElementById('productImage').value.trim(),
    description: document.getElementById('productDescription').value.trim(),
  };

  const isUpdate = Boolean(id);
  const url = isUpdate ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
  const method = isUpdate ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save product');

  showMsg(isUpdate ? 'Product updated.' : 'Product added.');
  resetProductForm();
  await fetchProducts();
}

async function deleteProduct(id) {
  const ok = window.confirm('Delete this product?');
  if (!ok) return;
  const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete product');
  showMsg('Product deleted.');
  await fetchProducts();
}

async function fetchOrders() {
  const res = await fetch(`${API_BASE}/orders`);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load orders');
  orders = json.data || [];
  renderOrders();
}

function renderOrders() {
  if (!ordersTableBody) return;
  if (!orders.length) {
    ordersTableBody.innerHTML = '<tr><td colspan="6">No orders yet.</td></tr>';
    return;
  }
  ordersTableBody.innerHTML = orders
    .map((order) => {
      const itemsSummary = (order.items || [])
        .map((item) => `${item.product_name} x ${item.qty}`)
        .join(', ');
      return `
        <tr>
          <td>#${order.id}<br/><small>${new Date(order.created_at).toLocaleString()}</small></td>
          <td>${order.customer_name}<br/><small>${order.phone}</small><br/><small>${order.address}</small></td>
          <td>${itemsSummary || '-'}</td>
          <td>₹${Number(order.total_amount).toFixed(0)}</td>
          <td>
            <select class="status-select" data-id="${order.id}">
              ${['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']
                .map((status) => `<option value="${status}" ${order.status === status ? 'selected' : ''}>${status}</option>`)
                .join('')}
            </select>
          </td>
          <td>
            <button class="table-btn" data-action="update-order" data-id="${order.id}">Update</button>
            <button class="table-btn danger" data-action="delete-order" data-id="${order.id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join('');
}

async function updateOrderStatus(id) {
  const select = document.querySelector(`.status-select[data-id="${id}"]`);
  if (!select) return;

  const res = await fetch(`${API_BASE}/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: select.value }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update order');
  showMsg(`Order #${id} updated to ${select.value}.`);
  await fetchOrders();
}

async function deleteOrder(id) {
  const ok = window.confirm(`Delete order #${id}?`);
  if (!ok) return;
  const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete order');
  showMsg(`Order #${id} deleted.`);
  await fetchOrders();
}

function attachEvents() {
  productForm?.addEventListener('submit', async (e) => {
    try {
      await upsertProduct(e);
    } catch (err) {
      showMsg(err.message, 'error');
    }
  });

  document.getElementById('resetProductForm')?.addEventListener('click', resetProductForm);
  document.getElementById('refreshProducts')?.addEventListener('click', () => fetchProducts().catch((err) => showMsg(err.message, 'error')));
  document.getElementById('refreshOrders')?.addEventListener('click', () => fetchOrders().catch((err) => showMsg(err.message, 'error')));

  productsTableBody?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    try {
      if (btn.dataset.action === 'edit-product') {
        const product = products.find((p) => Number(p.id) === id);
        if (product) fillProductForm(product);
      }
      if (btn.dataset.action === 'delete-product') {
        await deleteProduct(id);
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  });

  ordersTableBody?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    try {
      if (btn.dataset.action === 'update-order') await updateOrderStatus(id);
      if (btn.dataset.action === 'delete-order') await deleteOrder(id);
    } catch (err) {
      showMsg(err.message, 'error');
    }
  });
}

async function initAdmin() {
  if (!ensureAdminAccess()) return;
  attachEvents();
  try {
    await Promise.all([fetchProducts(), fetchOrders()]);
  } catch (err) {
    showMsg(err.message, 'error');
  }
}

initAdmin();
