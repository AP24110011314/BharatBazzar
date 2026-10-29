/**
 * api.js — Centralized API client for BharatBazzar frontend
 * Dynamic host resolution, session helpers, toast alerts & responsive navbar
 */

function resolveApiBase() {
  if (typeof window === 'undefined') return '/api';
  if (window.API_BASE) return window.API_BASE;
  if (window.BACKEND_API_URL && window.BACKEND_API_URL.trim() !== '') {
    return window.BACKEND_API_URL.trim().replace(/\/+$/, '');
  }
  const storageOverride = localStorage.getItem('BHARATBAZZAR_API_BASE');
  if (storageOverride && storageOverride.trim() !== '') {
    return storageOverride.trim().replace(/\/+$/, '');
  }

  const loc = window.location;
  // If served directly from Express backend on port 5001
  if (loc.port === '5001') {
    return '/api';
  }
  // If running on local dev server (port 3000, 5500, 8080, etc.), route to backend port 5001
  if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
    return `${loc.protocol}//${loc.hostname}:5001/api`;
  }
  // When deployed on Vercel or cloud hosts:
  // Relative '/api' works seamlessly with Vercel rewrites (reverse-proxying to Render)
  return '/api';
}

const API_BASE = resolveApiBase();

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, endpoint, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json();

  if (res.status === 401) {
    // Token expired — redirect to login
    localStorage.clear();
    if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
      window.location.href = 'index.html';
    }
    throw new Error('Session expired. Please log in again.');
  }

  return { ok: res.ok, status: res.status, data };
}

const api = {
  get:    (url)          => request('GET',    url),
  post:   (url, body)    => request('POST',   url, body),
  put:    (url, body)    => request('PUT',    url, body),
  delete: (url, body)    => request('DELETE', url, body),
};

// ── Session helpers ───────────────────────────────────────────
function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function getUser() {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

function requireAuth() {
  const token = getToken();
  if (!token) { window.location.href = 'index.html'; return false; }
  return true;
}

// ── helpers ───────────────────────────────────────────────────
function formatPrice(val) {
  return '₹' + parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function stars(rating) {
  const full = Math.round(rating || 0);
  let s = '';
  for (let i = 1; i <= 5; i++) s += i <= full ? '★' : '☆';
  return s;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins/60)}h ago`;
  return `${Math.floor(mins/1440)}d ago`;
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Loader ────────────────────────────────────────────────────
function showLoader() {
  if (document.getElementById('app-loader')) return;
  const div = document.createElement('div');
  div.id = 'app-loader';
  div.className = 'loader-overlay';
  div.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(div);
}
function hideLoader() {
  const el = document.getElementById('app-loader');
  if (el) el.remove();
}

// ── Mobile Navigation Toggle ──────────────────────────────────
function toggleMobileNav() {
  const navContainer = document.querySelector('.navbar');
  if (navContainer) {
    navContainer.classList.toggle('nav-expanded');
  }
}

// ── Navbar builder ────────────────────────────────────────────
function buildNavbar(activePage) {
  const user = getUser();
  const cartCount     = parseInt(localStorage.getItem('cartCount')     || '0');
  const wishlistCount = parseInt(localStorage.getItem('wishlistCount') || '0');
  const nav = `
    <nav class="navbar">
      <div class="container navbar-inner">
        <a href="products.html" class="nav-logo">
          <span class="nav-logo-icon">🌿</span> BharatBazzar
        </a>

        <button class="mobile-toggle" onclick="toggleMobileNav()" aria-label="Toggle navigation">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div class="nav-menu" id="navbar-menu">
          <div class="nav-links">
            <a href="products.html" class="nav-link ${activePage==='products'?'active':''}">
              <span class="nav-icon">🏪</span><span>Products</span>
            </a>
            <a href="wishlist.html" class="nav-link ${activePage==='wishlist'?'active':''}">
              <span class="nav-icon">♡</span><span>Wishlist</span>
              ${wishlistCount > 0 ? `<span class="cart-badge wishlist-badge" id="wishlist-badge">${wishlistCount}</span>` : '<span class="cart-badge wishlist-badge" id="wishlist-badge" style="display:none">0</span>'}
            </a>
            <a href="cart.html" class="nav-link ${activePage==='cart'?'active':''}">
              <span class="nav-icon">🛒</span><span>Cart</span>
              ${cartCount > 0 ? `<span class="cart-badge" id="cart-badge">${cartCount}</span>` : '<span class="cart-badge" id="cart-badge" style="display:none">0</span>'}
            </a>
            <a href="orders.html" class="nav-link ${activePage==='orders'?'active':''}">
              <span class="nav-icon">📦</span><span>Orders</span>
            </a>
            ${user && user.role === 'admin' ? `
            <a href="admin.html" class="nav-link ${activePage==='admin'?'active':''}">
              <span class="nav-icon">🛠️</span><span>Admin</span>
            </a>` : ''}
          </div>

          <div class="nav-user">
            ${user ? `
              <div class="user-chip">
                <div class="nav-avatar">${user.name ? user.name[0].toUpperCase() : 'U'}</div>
                <span class="user-name">${user.name ? user.name.split(' ')[0] : 'User'}</span>
              </div>
              <button onclick="logout()" class="btn btn-outline btn-sm logout-btn">Logout</button>
            ` : `<a href="index.html" class="btn btn-primary btn-sm login-btn">Login</a>`}
          </div>
        </div>
      </div>
    </nav>
  `;
  const placeholder = document.getElementById('navbar-placeholder');
  if (placeholder) placeholder.innerHTML = nav;
}

async function updateWishlistBadge() {
  try {
    if (!getToken()) return;
    const { data } = await api.get('/wishlist/ids');
    const count = data.ids?.length || 0;
    localStorage.setItem('wishlistCount', count);
    const badge = document.getElementById('wishlist-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  } catch(e) {}
}

async function updateCartBadge() {
  try {
    if (!getToken()) return;
    const { data } = await api.get('/cart');
    const count = data.cart?.items?.length || 0;
    localStorage.setItem('cartCount', count);
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  } catch(e) {}
}
