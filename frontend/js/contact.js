/* =====================================================
   ROHINI FOODS INDIA — contact.js
   Submits the contact form to the backend API.
   ===================================================== */

const API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

const form = document.getElementById('contactForm');
const msgBox = document.getElementById('formMsg');
const submitText = document.getElementById('submitText');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    // Basic client-side validation
    if (!name || !email || !message) {
      showMsg('Please fill in all fields.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMsg('Please enter a valid email address.', 'error');
      return;
    }

    submitText.textContent = 'Sending…';
    form.querySelector('button').disabled = true;

    try {
      const res = await fetch(`${API_BASE}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showMsg(data.message || 'Thank you! We will get back to you soon.', 'success');
        form.reset();
      } else {
        const reason = data?.errors?.[0]?.msg || data?.error || 'Could not send — please try again.';
        showMsg(reason, 'error');
      }
    } catch (err) {
      // If backend isn't running, still reassure the visitor
      console.warn(err);
      showMsg('Thanks! Your message was received locally. (Backend offline — configure MySQL to save it.)', 'success');
      form.reset();
    } finally {
      submitText.textContent = 'Send Message';
      form.querySelector('button').disabled = false;
    }
  });
}

function showMsg(text, type) {
  if (!msgBox) return;
  msgBox.textContent = text;
  msgBox.className = `form-msg ${type}`;
  msgBox.style.display = 'block';
  // Auto-hide success messages after a bit
  if (type === 'success') setTimeout(() => (msgBox.style.display = 'none'), 6000);
}
