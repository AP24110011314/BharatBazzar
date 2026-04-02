/**
 * api.js — Centralized API client for BharatBazzar frontend
 */

const API_BASE = 'http://localhost:5001/api';

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
  return '₹' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function stars(rating) {
  const full  = Math.round(rating);
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

// ── Navbar builder ────────────────────────────────────────────
function buildNavbar(activePage) {
  const user = getUser();
  const cartCount = parseInt(localStorage.getItem('cartCount') || '0');
  const nav = `
    <nav class="navbar">
      <div class="container">
        <a href="products.html" class="nav-logo">🛒 BharatBazzar</a>
        <div class="nav-links">
          <a href="products.html" class="nav-link ${activePage==='products'?'active':''}">
            <span>🏪</span><span>Products</span>
          </a>
          <a href="cart.html" class="nav-link ${activePage==='cart'?'active':''}">
            <span>🛒</span><span>Cart</span>
            ${cartCount > 0 ? `<span class="cart-badge" id="cart-badge">${cartCount}</span>` : '<span class="cart-badge" id="cart-badge" style="display:none">0</span>'}
          </a>
          <a href="orders.html" class="nav-link ${activePage==='orders'?'active':''}">
            <span>📦</span><span>Orders</span>
          </a>
        </div>
        <div class="nav-user">
          ${user ? `
            <div class="nav-avatar">${user.name ? user.name[0].toUpperCase() : 'U'}</div>
            <span style="font-size:0.85rem; color:var(--text-secondary)">${user.name ? user.name.split(' ')[0] : 'User'}</span>
            <button onclick="logout()" class="btn btn-outline btn-sm">Logout</button>
          ` : `<a href="index.html" class="btn btn-primary btn-sm">Login</a>`}
        </div>
      </div>
    </nav>
  `;
  const placeholder = document.getElementById('navbar-placeholder');
  if (placeholder) placeholder.innerHTML = nav;
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
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  } catch(e) {}
}
