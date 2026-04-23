/* =====================================================
   ROHINI FOODS INDIA — auth.js
   Demo login handler (frontend-only)
   ===================================================== */

const DEMO_EMAIL = 'anuragjadhav684@gmail.com';
const DEMO_PASSWORD = 'Rohini@123';

const loginForm = document.getElementById('loginForm');
const loginMsg = document.getElementById('loginMsg');

if (loginForm && loginMsg) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim().toLowerCase();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
      loginMsg.className = 'form-msg error';
      loginMsg.textContent = 'Please enter both email and password.';
      return;
    }

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      localStorage.setItem(
        'rf_user',
        JSON.stringify({
          email: DEMO_EMAIL,
          loggedInAt: new Date().toISOString(),
        })
      );
      window.dispatchEvent(new Event('rf-auth-changed'));
      loginMsg.className = 'form-msg success';
      loginMsg.textContent = 'Login successful. Redirecting to admin panel...';
      loginForm.reset();
      setTimeout(() => {
        window.location.href = 'admin.html';
      }, 700);
      return;
    }

    loginMsg.className = 'form-msg error';
    loginMsg.textContent = 'Invalid credentials. Use the demo login info shown on this page.';
  });
}
