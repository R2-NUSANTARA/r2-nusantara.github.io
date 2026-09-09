/* ============================================================
   R2 NUSANTARA — app.js
   Logic aplikasi: state, actions, dan render.
   Tidak ada perubahan pada alur bisnis/data — hanya ditambah
   beberapa micro-interaction (pulse badge, nav indicator, kelas
   interaktif) untuk upgrade desain.
   ============================================================ */

// --- STATE ---
let query = "";
let activeTab = "Beranda";
let cartCount = 0;
let wishlist = [];
let isMenuOpen = false;
let isSearchOpen = false;

// --- HELPER FUNCTIONS ---
function formatPrice(value) {
  if (!value) return "Harga Tidak Tersedia";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function scrollToId(id) {
  if (!id) return;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Memicu ulang animasi CSS pada sebuah elemen (dipakai untuk badge pop)
function pulse(el, className) {
  if (!el) return;
  el.classList.remove(className);
  // force reflow supaya animasi bisa di-restart
  void el.offsetWidth;
  el.classList.add(className);
}

// --- ACTIONS ---
function handleSearch(value) {
  query = value;
  document.getElementById('header-search-input').value = query;
  document.getElementById('hero-search-input').value = query;
  renderProducts();
}

function resetSearch() {
  handleSearch("");
  scrollToId('produk');
}

function openSearchDrawer() {
  if (!isSearchOpen) toggleSearch();
}

function toggleSearch() {
  isSearchOpen = !isSearchOpen;
  const drawer = document.getElementById('search-drawer');
  if (isSearchOpen) {
    drawer.classList.remove('hidden');
    document.getElementById('header-search-input').focus();
  } else {
    drawer.classList.add('hidden');
  }
}

function toggleMenu() {
  isMenuOpen = !isMenuOpen;
  const drawer = document.getElementById('menu-drawer');
  const icon = document.getElementById('menu-icon');

  if (isMenuOpen) {
    drawer.classList.remove('hidden');
    icon.setAttribute('data-lucide', 'x');
  } else {
    drawer.classList.add('hidden');
    icon.setAttribute('data-lucide', 'menu');
  }
  lucide.createIcons();
}

function goToCart() {
  setActiveTab("Keranjang");
  scrollToId("produk");
}

function goToCatalog() {
  setActiveTab("Katalog");
  scrollToId("produk");
}

function handleMenuClick(label, id) {
  toggleMenu();
  setActiveTab(label === "Beranda" ? "Beranda" : "Katalog");
  scrollToId(id);
}

function setActiveTab(tab) {
  activeTab = tab;
  renderBottomNav();
}

function addToCart() {
  cartCount++;
  updateCartUI();
}

function toggleWishlist(id) {
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(item => item !== id);
  } else {
    wishlist.push(id);
  }
  renderProducts();
  updateWishlistUI();
}

// --- RENDER FUNCTIONS ---
function updateCartUI() {
  const badge = document.getElementById('header-cart-badge');
  if (cartCount > 0) {
    badge.innerText = cartCount;
    badge.classList.remove('hidden');
    pulse(badge, 'badge-pop');
  } else {
    badge.classList.add('hidden');
  }
  renderBottomNav();
}

function updateWishlistUI() {
  const counter = document.getElementById('wishlist-counter');
  const text = document.getElementById('wishlist-count-text');
  if (wishlist.length > 0) {
    text.innerText = `${wishlist.length} wishlist`;
    counter.classList.remove('hidden');
    counter.classList.add('flex');
  } else {
    counter.classList.add('hidden');
    counter.classList.remove('flex');
  }
}

function renderTrustItems() {
  const container = document.getElementById('trust-container');
  container.innerHTML = trustItems.map(item => `
    <div class="card-interactive rounded-xl text-center p-2 border border-transparent">
      <div class="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
        <i data-lucide="${item.icon}" class="w-[17px] h-[17px] stroke-[1.7] text-slate-600"></i>
      </div>
      <div class="text-[9px] font-extrabold text-slate-800">${item.title}</div>
      <div class="mt-0.5 text-[8px] text-slate-400">${item.subtitle}</div>
    </div>
  `).join('');
}

function renderCategories() {
  const container = document.getElementById('categories-container');
  container.innerHTML = categories.map(cat => `
    <button type="button" onclick="handleSearch('${cat.name === 'Rokok R2' || cat.name === 'Rokok Resmi' ? cat.name : cat.name}'); scrollToId('produk');" class="btn-interactive card-interactive w-40 shrink-0 snap-start overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm">
      <div class="relative h-[104px] overflow-hidden bg-slate-100">
        <img src="${cat.image}" alt="${cat.name}" class="h-full w-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <div class="absolute bottom-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90">
          <i data-lucide="${cat.icon}" class="w-[11px] h-[11px] text-slate-700"></i>
        </div>
      </div>
      <div class="flex items-center justify-between px-3 py-2.5">
        <div>
          <div class="text-[9px] font-extrabold text-slate-800">${cat.name}</div>
          <div class="mt-0.5 text-[7px] text-slate-400">(${cat.subtitle})</div>
        </div>
        <i data-lucide="chevron-right" class="w-3 h-3 text-slate-400"></i>
      </div>
    </button>
  `).join('');
}

function renderProducts() {
  const container = document.getElementById('products-container');
  const emptyState = document.getElementById('products-empty');
  const countLabel = document.getElementById('product-count');

  const normalized = query.trim().toLowerCase();
  let filtered = allProducts;

  if (normalized) {
    // Logic khusus untuk klik kategori generik
    if (normalized === 'rokok r2') {
      filtered = allProducts.filter(p => p.categoryType === 'r2');
    } else if (normalized === 'rokok resmi') {
      filtered = allProducts.filter(p => p.categoryType === 'resmi');
    } else {
      filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(normalized) ||
        (p.displayCategory && p.displayCategory.toLowerCase().includes(normalized))
      );
    }
  }

  countLabel.innerText = filtered.length;

  if (filtered.length > 0) {
    container.classList.remove('hidden');
    emptyState.classList.add('hidden');

    // Render maksimal 100 item supaya tidak lag di perangkat mobile
    const displayLimit = filtered.slice(0, 100);

    container.innerHTML = displayLimit.map(product => {
      const isWishlisted = wishlist.includes(product.id);
      const heartColor = isWishlisted ? 'text-[#111827]' : 'text-slate-500';

      return `
        <article class="card-interactive relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_5px_18px_rgba(15,23,42,0.05)]">
          <div class="relative h-[145px] overflow-hidden bg-slate-100">
            <img src="${product.image}" alt="${product.name}" class="h-full w-full object-cover" loading="lazy" />
            <div class="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-1 text-[6px] font-extrabold tracking-[0.05em] text-white">
              READY STOCK
            </div>
            <button type="button" onclick="toggleWishlist('${product.id}')" class="btn-interactive absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 shadow-sm" aria-label="Simpan ke wishlist">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="${isWishlisted ? '#111827' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="${heartColor}"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </button>
          </div>
          <div class="p-3">
            <div class="text-[6px] font-semibold uppercase tracking-[0.1em] text-slate-400 truncate line-clamp-1">${product.displayCategory}</div>
            <h3 class="mt-1 text-[11px] font-extrabold text-slate-800 line-clamp-1">${product.name}</h3>
            <div class="mt-1.5 text-[10px] font-extrabold text-slate-900">${formatPrice(product.price)}</div>
            <button type="button" onclick="addToCart()" class="btn-interactive mt-3 flex h-8 w-full items-center justify-center gap-1 rounded-lg text-[8px] font-extrabold bg-navy text-white active:bg-slate-800">
              <i data-lucide="shopping-cart" class="w-[11px] h-[11px]"></i> Tambah
            </button>
          </div>
        </article>
      `;
    }).join('');
  } else {
    container.classList.add('hidden');
    emptyState.classList.remove('hidden');
  }
  lucide.createIcons();
}

function renderMenuDrawer() {
  const menuData = [
    ["Beranda", "beranda"],
    ["Kategori", "kategori"],
    ["Produk", "produk"],
    ["Keranjang", "produk"]
  ];
  const container = document.getElementById('menu-container');
  container.innerHTML = menuData.map(([label, id]) => `
    <button type="button" onclick="handleMenuClick('${label}', '${id}')" class="btn-interactive rounded-xl bg-slate-50 px-3 py-3 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-navy">
      ${label}
    </button>
  `).join('');
}

function renderBottomNav() {
  const container = document.getElementById('bottom-nav');

  // Home indicator iOS
  const homeIndicator = `<div class="pointer-events-none absolute bottom-1.5 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white/60"></div>`;

  container.innerHTML = navItems.map(item => {
    const isActive = activeTab === item.label;
    const color = isActive ? 'text-gold' : 'text-[#94A3B8]';
    const stroke = isActive ? 'stroke-[2.2]' : 'stroke-[1.7]';
    const indicator = isActive ? '<span class="nav-indicator" aria-hidden="true"></span>' : '';

    let cartBadgeHTML = '';
    if (item.label === 'Keranjang' && cartCount > 0) {
      cartBadgeHTML = `<span class="absolute -right-2 -top-2 flex h-[14px] min-w-[14px] items-center justify-center rounded-full px-1 text-[7px] font-extrabold bg-gold text-navy shadow-sm">${cartCount}</span>`;
    }

    return `
      <button type="button" onclick="setActiveTab('${item.label}'); scrollToId('${item.id}')" class="btn-interactive relative flex min-w-[54px] flex-col items-center gap-1 z-10">
        ${indicator}
        <div class="relative ${color}">
          <i data-lucide="${item.icon}" class="w-[17px] h-[17px] ${stroke}"></i>
          ${cartBadgeHTML}
        </div>
        <span class="text-[7px] font-semibold ${color}">${item.label}</span>
      </button>
    `;
  }).join('') + homeIndicator;

  lucide.createIcons();
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  renderTrustItems();
  renderCategories();
  renderProducts();
  renderMenuDrawer();
  renderBottomNav();
  lucide.createIcons();
});
