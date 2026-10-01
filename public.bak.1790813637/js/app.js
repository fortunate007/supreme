const API = '/api';
let cart = JSON.parse(localStorage.getItem('supreme_cart') || '[]');
const WHATSAPP = '25475992922';
const EMAIL = 'info@supremeautoparts.co.ke';

const money = n => 'KSh ' + Number(n || 0).toLocaleString();
const waLink = msg => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#1a1a1a"/><text x="50%" y="50%" fill="#d32f2f" font-family="sans-serif" font-size="28" font-weight="900" text-anchor="middle" dominant-baseline="middle">SUPREME AUTO PARTS</text></svg>`);

function saveCart(){ localStorage.setItem('supreme_cart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount(){ const el=document.getElementById('cart-count'); if(el) el.textContent = cart.reduce((s,i)=>s+i.qty,0); }
function addToCart(product, qty=1){
  const ex = cart.find(i => i.id === product.id);
  if (ex) ex.qty += qty; else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty });
  saveCart(); alert('Added to cart');
}
async function api(url, options={}){
  const res = await fetch(API + url, options);
  if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Request failed');
  return res.json();
}

function categoryCard(c){
  const inner = c.image
    ? `<img class="category-img" src="/uploads/categories/${c.image || 'placeholder/placeholder.png'}" alt="${c.name || 'category'}" loading="lazy">`
    : `<img class="category-img" src="/uploads/categories/${c.image || 'placeholder/placeholder.png'}" alt="${c.name || 'category'}" loading="lazy">`;
  return `<a class="category-card" href="/products.html?category=${c.slug}">${inner}<div class="cat-body"><h3>${c.name}</h3><p>${c.description||''}</p></div></a>`;
}

async function loadCategories(){
  const cats = await api('/categories');
  const menu = document.getElementById('category-menu');
  if (menu) menu.innerHTML = cats.map(c => `<a href="/products.html?category=${c.slug}" class="menu-item">${c.image ? `<img src="${c.image}" class="menu-thumb">` : `<span class="menu-emoji">${c.icon||'📦'}</span>`} ${c.name}</a>`).join('');
  const sel = document.getElementById('category-select');
  if (sel) sel.innerHTML = '<option value="">All Categories</option>' + cats.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
  const grid = document.getElementById('category-grid');
  if (grid) grid.innerHTML = cats.slice(0, 12).map(categoryCard).join('');
}

function productCard(p){
  const carText = p.car_make || p.car_model ? `${p.car_make||''} ${p.car_model||''}`.trim() : (p.fits || (p.universal ? 'Universal' : ''));
  return `<div class="product-card"><a href="/product.html?id=${p.id}"><img src="${p.image || placeholder}" alt="${p.name}"></a><div class="product-info"><span class="badge">${p.category_name || 'Universal'}</span><h3><a href="/product.html?id=${p.id}">${p.name}</a></h3><p class="brand">${p.brand || ''}</p>${carText ? `<p class="car-fit">🚗 Fits: ${carText}</p>` : ''}<p class="price">${money(p.price)}</p><button class="btn add-btn" onclick='addToCart(${JSON.stringify(p).replace(/'/g,"&#39;")})'>Add to Cart</button></div></div>`;
}

async function loadFeatured(){
  const grid = document.getElementById('featured-grid'); if (!grid) return;
  const products = await api('/products');
  grid.innerHTML = products.slice(0, 8).map(productCard).join('');
}
async function loadOffers(limit){
  const grid = document.getElementById('offers-grid'); if (!grid) return;
  const offers = await api('/offers');
  const list = limit ? offers.slice(0, limit) : offers;
  if (!list.length){ grid.innerHTML = '<p>No active offers right now. Check back soon!</p>'; return; }
  grid.innerHTML = list.map(o => `<div class="offer-card"><span class="offer-tag">🔥 OFFER</span>${o.image ? `<img src="${o.image}" alt="${o.title}">` : ''}<div class="offer-info"><h3>${o.title}</h3><p class="desc">${o.description||''}</p><p class="price">${money(o.price)} ${o.old_price ? `<span class="old-price">${money(o.old_price)}</span>` : ''}</p><div class="offer-actions"><a class="btn green" href="${waLink('Hi Supreme Auto Parts, I am interested in the offer: ' + o.title)}" target="_blank">Order on WhatsApp</a></div></div></div>`).join('');
}
async function loadProductsPage(){
  const grid = document.getElementById('products-grid'); if (!grid) return;
  const params = new URLSearchParams(location.search);
  const q = new URLSearchParams();
  ['category','search','universal','car_make','car_model'].forEach(k => { if (params.get(k)) q.set(k, params.get(k)); });
  const products = await api('/products?' + q.toString());
  grid.innerHTML = products.length ? products.map(productCard).join('') : '<p>No products found. Try a different car model or category.</p>';
  const title = document.getElementById('products-title');
  if (title) title.textContent = params.get('category') ? params.get('category').replace(/-/g,' ').toUpperCase() : (params.get('search') ? 'Search: ' + params.get('search') : 'All Products');
}
async function loadProductDetail(){
  const c = document.getElementById('product-detail'); if (!c) return;
  const id = new URLSearchParams(location.search).get('id'); if (!id) return;
  const p = await api('/products/' + id);
  const carText = p.car_make || p.car_model ? `${p.car_make||''} ${p.car_model||''}`.trim() : (p.fits || 'Universal / Check compatibility');
  c.innerHTML = `<div class="detail-grid"><img src="${p.image || placeholder}" alt="${p.name}"><div><span class="badge">${p.category_name || 'Universal'}</span><h1>${p.name}</h1><p class="brand">${p.brand || ''} ${p.sku ? '| SKU: '+p.sku : ''}</p><p class="price">${money(p.price)}</p><p style="margin:1rem 0">${p.description || ''}</p><p><strong>🚗 Fits:</strong> ${carText}</p><p><strong>📦 Stock:</strong> ${p.stock > 0 ? p.stock + ' available' : 'Available on order'}</p><p><strong>🛡️ Warranty:</strong> Yes — all products come with warranty</p><div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1rem"><button class="btn" onclick='addToCart(${JSON.stringify(p).replace(/'/g,"&#39;")})'>Add to Cart</button><a class="btn green" target="_blank" href="${waLink('Hi, I want to order: ' + p.name + ' (KSh ' + p.price + ')')}">Order on WhatsApp</a></div></div></div>`;
}
function renderCart(){
  const c = document.getElementById('cart-items'); if (!c) return;
  if (!cart.length){ c.innerHTML = '<p>Your cart is empty.</p>'; const t=document.getElementById('cart-total'); if(t) t.textContent='KSh 0'; return; }
  c.innerHTML = cart.map((i, idx) => `<div class="cart-item"><img src="${i.image || placeholder}" alt=""><div><h4>${i.name}</h4><p>${money(i.price)}</p></div><input type="number" min="1" value="${i.qty}" onchange="updateQty(${idx}, this.value)"><button class="btn danger" onclick="removeItem(${idx})">Remove</button></div>`).join('');
  document.getElementById('cart-total').textContent = money(cart.reduce((s,i)=>s+i.price*i.qty,0));
}
function updateQty(idx, val){ cart[idx].qty = Math.max(1, parseInt(val)||1); saveCart(); renderCart(); }
function removeItem(idx){ cart.splice(idx,1); saveCart(); renderCart(); }
async function checkout(e){
  e.preventDefault();
  if (!cart.length) return alert('Cart is empty');
  const data = Object.fromEntries(new FormData(e.target));
  data.items = cart;
  data.total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  try{
    const res = await api('/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
    const waMsg = `New Order from ${data.customer_name}%0APhone: ${data.phone}%0ALocation: ${data.location}%0ATotal: ${money(data.total)}`;
    if (confirm(res.message + '\n\nSend order details to WhatsApp now?'))
      window.open(`https://wa.me/${WHATSAPP}?text=${waMsg}`, '_blank');
    cart = []; saveCart(); renderCart(); e.target.reset();
  } catch(err){ alert(err.message); }
}
function toggleMenu(){
  document.getElementById('side-menu')?.classList.toggle('open');
  document.getElementById('overlay')?.classList.toggle('show');
}
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount(); loadCategories(); loadFeatured(); loadProductsPage(); loadProductDetail(); renderCart();
  const offersGrid = document.getElementById('offers-grid');
  if (offersGrid) loadOffers(location.pathname.includes('offers') ? null : 3);
  document.getElementById('checkout-form')?.addEventListener('submit', checkout);
  document.getElementById('menu-btn')?.addEventListener('click', toggleMenu);
  document.getElementById('overlay')?.addEventListener('click', toggleMenu);
  document.getElementById('search-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target); const q = new URLSearchParams();
    if (fd.get('q')) q.set('search', fd.get('q'));
    if (fd.get('car_model')) q.set('car_model', fd.get('car_model'));
    location.href = '/products.html?' + q.toString();
  });
  document.getElementById('filter-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target); const q = new URLSearchParams();
    ['search','category','car_make','car_model'].forEach(k => { if (fd.get(k)) q.set(k, fd.get(k)); });
    if (fd.get('universal')) q.set('universal','1');
    location.href = '/products.html?' + q.toString();
  });
  document.querySelectorAll('.faq-q').forEach(q => q.addEventListener('click', () => q.parentElement.classList.toggle('open')));
  // Hidden admin shortcut: Ctrl + Shift + A
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
      window.location.href = '/supreme-control-9x7k';
    }
  });
});
