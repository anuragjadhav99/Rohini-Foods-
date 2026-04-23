/* =====================================================
   ROHINI FOODS INDIA — main.js
   Navigation, scroll reveal, sticky navbar shadow
   ===================================================== */

// ---------- Mobile nav toggle ----------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });
  // Close menu when any link is tapped
  navLinks.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    })
  );
}

// ---------- Brand logo ----------
function applyBrandLogo() {
  const logoSrc = 'images/brand-logo.png';

  document.querySelectorAll('.brand').forEach((brandEl) => {
    brandEl.innerHTML = `
      <img src="${logoSrc}" alt="Rohini Foods India" class="brand-logo-img" />
      <span class="sr-only">Rohini Foods India</span>
    `;
  });
}

// ---------- Navbar shadow on scroll ----------
const navbar = document.getElementById('navbar');
if (navbar) {
  const onScroll = () => {
    if (window.scrollY > 20) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ---------- Scroll reveal ----------
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger siblings slightly for a nicer cascade
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  // Fallback: just show everything
  reveals.forEach((el) => el.classList.add('visible'));
}

// ---------- Update footer year dynamically ----------
const yearEls = document.querySelectorAll('[data-year]');
yearEls.forEach((el) => (el.textContent = new Date().getFullYear()));

// ---------- Global cart count in navbar ----------
function updateGlobalCartCount() {
  const el = document.getElementById('cartCount');
  if (!el) return;
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem('rf_cart') || '[]');
  } catch {
    cart = [];
  }
  const qty = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
  el.textContent = String(qty);
}

// ---------- Auth-aware nav label ----------
function updateAuthNavLabel() {
  const loginNavLink =
    document.querySelector('#navLinks a[href="login.html"]') ||
    document.querySelector('#navLinks a[href$="/login.html"]');
  if (!loginNavLink) return;

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('rf_user') || 'null');
  } catch {
    user = null;
  }

  if (user && user.email) {
    loginNavLink.textContent = 'Profile';
    loginNavLink.setAttribute('aria-label', 'Profile');
  } else {
    loginNavLink.textContent = 'Login';
    loginNavLink.setAttribute('aria-label', 'Login');
  }
}

applyBrandLogo();
updateGlobalCartCount();
updateAuthNavLabel();
window.addEventListener('rf-auth-changed', updateAuthNavLabel);
