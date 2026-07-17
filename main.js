
/* ============================================
   HYDRA — Main JavaScript
   ============================================ */

// ===== CART SYSTEM =====
const Cart = (function () {
  const STORAGE_KEY = 'hydra_cart';

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    dispatch();
  }

  function dispatch() {
    document.dispatchEvent(new CustomEvent('cart:change'));
  }

  function items() { return load(); }
  function count() { return load().reduce((s, i) => s + i.qty, 0); }
  function total() { return load().reduce((s, i) => s + i.price * i.qty, 0); }

  function add(product) {
    const cart = load();
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    save(cart);
    showToast(product.name + ' added to cart');
  }

  function remove(id) {
    save(load().filter(i => i.id !== id));
  }

  function updateQty(id, qty) {
    const cart = load();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    if (qty <= 0) { remove(id); return; }
    item.qty = qty;
    save(cart);
  }

  function clear() { save([]); }

  return { items, count, total, add, remove, updateQty, clear };
})();

// ===== TOAST =====
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    ${message}`;
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== CART DRAWER =====
const overlay = document.querySelector('.overlay');
const cartDrawer = document.querySelector('.cart-drawer');
const cartItemsEl = document.querySelector('.cart-items');
const cartFooter = document.querySelector('.cart-footer');
const cartBadge = document.querySelector('.cart-badge');
const cartSubtotal = document.querySelector('.cart-subtotal span:last-child');

function openCart() {
  overlay.classList.add('open');
  cartDrawer.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  overlay.classList.remove('open');
  cartDrawer.classList.remove('open');
  document.body.style.overflow = '';
}

window.__openCart = openCart;

document.querySelectorAll('[data-open-cart]').forEach(btn => {
  btn.addEventListener('click', openCart);
});

document.querySelectorAll('[data-close-cart]').forEach(el => {
  el.addEventListener('click', closeCart);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCart();
});

// ===== RENDER CART =====
function renderCart() {
  const items = Cart.items();
  const total = Cart.total();
  const count = Cart.count();

  // Badge
  if (cartBadge) {
    cartBadge.style.display = count > 0 ? 'flex' : 'none';
    cartBadge.textContent = count;
  }

  // Items
  if (items.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <p>Your cart is empty.</p>
        <p><a href="product.html">Shop now</a></p>
      </div>`;
    cartFooter.style.display = 'none';
  } else {
    cartItemsEl.innerHTML = items.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="">
        <div class="cart-item-body">
          <p>${item.name}</p>
          <p>${item.variant || ''}</p>
        </div>
        <div class="cart-item-qty">
          <button data-dec="${item.id}">−</button>
          <span>${item.qty}</span>
          <button data-inc="${item.id}">+</button>
        </div>
        <button class="cart-item-remove" data-remove="${item.id}" aria-label="Remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `).join('');

    // Bind qty buttons
    cartItemsEl.querySelectorAll('[data-inc]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = items.find(i => i.id === btn.dataset.inc);
        if (item) Cart.updateQty(item.id, item.qty + 1);
      });
    });
    cartItemsEl.querySelectorAll('[data-dec]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = items.find(i => i.id === btn.dataset.dec);
        if (item) Cart.updateQty(item.id, item.qty - 1);
      });
    });
    cartItemsEl.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => Cart.remove(btn.dataset.remove));
    });

    cartFooter.style.display = 'block';
  }

  if (cartSubtotal) cartSubtotal.textContent = '$' + total.toFixed(2);
}

renderCart();
document.addEventListener('cart:change', renderCart);

// ===== ADD TO CART BUTTONS =====
document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
  btn.addEventListener('click', () => {
    Cart.add({
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: parseFloat(btn.dataset.price),
      image: btn.dataset.image,
      variant: btn.dataset.variant || '',
    });
  });
});

// ===== MOBILE MENU =====
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileNav = document.querySelector('.mobile-nav');

if (mobileMenuBtn && mobileNav) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });
}

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ===== SCROLL-LOCK HEADER =====
let lastScroll = 0;
const header = document.querySelector('.site-header');

window.addEventListener('scroll', () => {
  const current = window.scrollY;
  if (current > 80) {
    header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
  } else {
    header.style.boxShadow = 'none';
  }
  lastScroll = current;
}, { passive: true });
