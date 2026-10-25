async function adminApi(url, options={}){
const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
  '<rect width="100%" height="100%" fill="#1a1a1a"/>' +
  '<text x="50%" y="50%" fill="#d32f2f" font-family="Arial, sans-serif" font-size="26" font-weight="900" text-anchor="middle" dominant-baseline="middle">SUPREME AUTO PARTS</text>' +
  '</svg>'
);
  const res = await fetch('/api' + url, options);
  if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Request failed');
  return res.json();
}
async function checkAuth(){
  const me = await adminApi('/admin/me');
  document.getElementById('login-section').style.display = me.loggedIn ? 'none' : 'block';
  document.getElementById('dashboard-section').style.display = me.loggedIn ? 'block' : 'none';
  if (me.loggedIn){ document.getElementById('admin-name').textContent = me.username; loadAdminData(); }
}
async function login(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  try{
    await adminApi('/admin/login', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') }) });
    e.target.reset(); checkAuth();
  } catch(err){ alert(err.message); }
}
async function logout(){ await adminApi('/admin/logout', { method:'POST' }); checkAuth(); }
async function loadAdminData(){ await loadAdminCategories(); await loadAdminProducts(); await loadAdminOffers(); await loadAdminOrders(); }

/* ---------- CATEGORIES ---------- */
let editCategoryId = null;
async function loadAdminCategories(){
  const cats = await adminApi('/categories');
  const sel = document.getElementById('prod-category');
  if (sel) sel.innerHTML = '<option value="">Select category</option>' + cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  const tb = document.getElementById('categories-table');
  if (tb) tb.innerHTML = cats.map(c => `<tr>
    <td>${c.id}</td>
    <td>${c.image ? `<img src="${c.image}" style="width:50px;height:40px;object-fit:cover;border-radius:4px">` : `<span style="font-size:1.5rem">${c.icon||'📦'}</span>`}</td>
    <td>${c.name}</td><td>${c.slug}</td><td>${c.icon||''}</td>
    <td>
      <button class="btn dark" onclick='editCategory(${JSON.stringify(c).replace(/'/g,"&#39;")})'>Edit</button>
      <button class="btn danger" onclick="deleteCategory(${c.id})">Delete</button>
    </td></tr>`).join('');
}
function editCategory(c){
  editCategoryId = c.id;
  const f = document.getElementById('category-form');
  f.name.value = c.name; f.slug.value = c.slug; f.icon.value = c.icon || '';
  f.description.value = c.description || ''; f.image.value = '';
  document.getElementById('category-form-title').textContent = 'Edit Category #' + c.id;
  document.getElementById('category-submit').textContent = 'Update Category';
  document.getElementById('category-cancel').style.display = 'inline-block';
  if (c.image) showCategoryPreview(c.image);
  f.scrollIntoView({behavior:'smooth'});
}
function resetCategoryForm(){
  editCategoryId = null;
  const f = document.getElementById('category-form'); f.reset();
  document.getElementById('category-form-title').textContent = 'Add Category';
  document.getElementById('category-submit').textContent = 'Add Category';
  document.getElementById('category-cancel').style.display = 'none';
  document.getElementById('cat-preview').innerHTML = '';
}
async function saveCategory(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  try{
    if (editCategoryId) await adminApi('/admin/categories/' + editCategoryId, { method:'PUT', body: fd });
    else await adminApi('/admin/categories', { method:'POST', body: fd });
    resetCategoryForm(); loadAdminCategories();
    alert(editCategoryId ? 'Category updated' : 'Category added');
  } catch(err){ alert(err.message); }
}
async function deleteCategory(id){ if(!confirm('Delete category?'))return; await adminApi('/admin/categories/'+id,{method:'DELETE'}); loadAdminCategories(); }
function showCategoryPreview(src){
  document.getElementById('cat-preview').innerHTML = `<img src="${src}" style="max-width:180px;border-radius:8px;border:2px solid #d32f2f">`;
}

/* ---------- PRODUCTS ---------- */
let editProductId = null;
async function loadAdminProducts(){
  const products = await adminApi('/products');
  const tb = document.getElementById('products-table');
  if (tb) tb.innerHTML = products.map(p => `<tr>
    <td>${p.id}</td>
    <td>${p.image ? `<img src="${p.image}" style="width:50px;height:40px;object-fit:cover;border-radius:4px">` : '—'}</td>
    <td>${p.name}</td><td>${p.category_name||''}</td><td>${p.price}</td><td>${p.stock}</td>
    <td>${p.car_make||''} ${p.car_model||''}</td><td>${p.universal?'Yes':'No'}</td>
    <td>
      <button class="btn dark" onclick='editProduct(${JSON.stringify(p).replace(/'/g,"&#39;")})'>Edit</button>
      <button class="btn danger" onclick="deleteProduct(${p.id})">Delete</button>
    </td></tr>`).join('');
}
function editProduct(p){
  editProductId = p.id;
  const f = document.getElementById('product-form');
  f.name.value = p.name; f.category_id.value = p.category_id || ''; f.brand.value = p.brand || '';
  f.description.value = p.description || ''; f.price.value = p.price; f.stock.value = p.stock;
  f.car_make.value = p.car_make || ''; f.car_model.value = p.car_model || '';
  f.fits.value = p.fits || ''; f.sku.value = p.sku || ''; f.universal.checked = p.universal === 1;
  f.image.value = ''; // clear file
  document.getElementById('product-form-title').textContent = 'Edit Product #' + p.id;
  document.getElementById('product-submit').textContent = 'Update Product';
  document.getElementById('product-cancel').style.display = 'inline-block';
  if (p.image) showProductPreview(p.image);
  f.scrollIntoView({behavior:'smooth'});
}
function resetProductForm(){
  editProductId = null;
  const f = document.getElementById('product-form'); f.reset();
  document.getElementById('product-form-title').textContent = 'Add / Update Product';
  document.getElementById('product-submit').textContent = 'Save Product';
  document.getElementById('product-cancel').style.display = 'none';
  document.getElementById('prod-preview').innerHTML = '';
}
async function saveProduct(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  try{
    if (editProductId) await adminApi('/admin/products/' + editProductId, { method:'PUT', body: fd });
    else await adminApi('/admin/products', { method:'POST', body: fd });
    resetProductForm(); loadAdminProducts();
    alert(editProductId ? 'Product updated' : 'Product added');
  } catch(err){ alert(err.message); }
}
async function deleteProduct(id){ if(!confirm('Delete product?'))return; await adminApi('/admin/products/'+id,{method:'DELETE'}); loadAdminProducts(); }
function showProductPreview(src){
  document.getElementById('prod-preview').innerHTML = `<img src="${src}" style="max-width:180px;border-radius:8px;border:2px solid #d32f2f">`;
}

/* ---------- OFFERS ---------- */
let editOfferId = null;
async function loadAdminOffers(){
  const offers = await adminApi('/admin/offers');
  const tb = document.getElementById('offers-table');
  if (tb) tb.innerHTML = offers.map(o => `<tr>
    <td>${o.id}</td>
    <td>${o.image ? `<img src="${o.image}" style="width:50px;height:40px;object-fit:cover;border-radius:4px">` : '—'}</td>
    <td>${o.title}</td><td>${o.price}</td><td>${o.old_price||''}</td><td>${o.active?'Yes':'No'}</td>
    <td>
      <button class="btn dark" onclick='editOffer(${JSON.stringify(o).replace(/'/g,"&#39;")})'>Edit</button>
      <button class="btn danger" onclick="deleteOffer(${o.id})">Delete</button>
    </td></tr>`).join('');
}
function editOffer(o){
  editOfferId = o.id;
  const f = document.getElementById('offer-form');
  f.title.value = o.title; f.description.value = o.description || '';
  f.price.value = o.price; f.old_price.value = o.old_price || ''; f.image.value = '';
  f.active.checked = o.active === 1;
  document.getElementById('offer-form-title').textContent = 'Edit Offer #' + o.id;
  document.getElementById('offer-submit').textContent = 'Update Offer';
  document.getElementById('offer-cancel').style.display = 'inline-block';
  if (o.image) showOfferPreview(o.image);
  f.scrollIntoView({behavior:'smooth'});
}
function resetOfferForm(){
  editOfferId = null;
  const f = document.getElementById('offer-form'); f.reset();
  document.getElementById('offer-form-title').textContent = 'Add / Update Offer';
  document.getElementById('offer-submit').textContent = 'Save Offer';
  document.getElementById('offer-cancel').style.display = 'none';
  document.getElementById('offer-preview').innerHTML = '';
}
async function saveOffer(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  try{
    if (editOfferId) await adminApi('/admin/offers/' + editOfferId, { method:'PUT', body: fd });
    else await adminApi('/admin/offers', { method:'POST', body: fd });
    resetOfferForm(); loadAdminOffers();
    alert(editOfferId ? 'Offer updated' : 'Offer added');
  } catch(err){ alert(err.message); }
}
async function deleteOffer(id){ if(!confirm('Delete offer?'))return; await adminApi('/admin/offers/'+id,{method:'DELETE'}); loadAdminOffers(); }
function showOfferPreview(src){
  document.getElementById('offer-preview').innerHTML = `<img src="${src}" style="max-width:180px;border-radius:8px;border:2px solid #d32f2f">`;
}

/* ---------- ORDERS ---------- */
async function loadAdminOrders(){
  const orders = await adminApi('/admin/orders');
  const tb = document.getElementById('orders-table');
  if (tb) tb.innerHTML = orders.map(o => `<tr><td>${o.id}</td><td>${o.customer_name}</td><td>${o.phone}</td><td>${o.email||''}</td><td>${o.location}</td><td>${o.total}</td><td>${o.status}</td><td>${new Date(o.created_at).toLocaleString()}</td></tr>`).join('');
}

/* ---------- TABS & INIT ---------- */
function showTab(name){
  document.querySelectorAll('.admin-tab-panel').forEach(p => p.style.display = 'none');
  document.getElementById('tab-'+name).style.display = 'block';
  document.querySelectorAll('.admin-tabs button').forEach(b => b.classList.remove('active'));
  document.querySelector(`.admin-tabs button[data-tab="${name}"]`)?.classList.add('active');
}
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  document.getElementById('login-form')?.addEventListener('submit', login);
  document.getElementById('logout-btn')?.addEventListener('click', logout);
  document.getElementById('product-form')?.addEventListener('submit', saveProduct);
  document.getElementById('category-form')?.addEventListener('submit', saveCategory);
  document.getElementById('offer-form')?.addEventListener('submit', saveOffer);
  document.getElementById('product-cancel')?.addEventListener('click', resetProductForm);
  document.getElementById('category-cancel')?.addEventListener('click', resetCategoryForm);
  document.getElementById('offer-cancel')?.addEventListener('click', resetOfferForm);
  document.querySelectorAll('.admin-tabs button').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

  // Live image previews
  document.querySelector('input[name="image"]')?.addEventListener('change', e => {
    if (e.target.files[0]) showProductPreview(URL.createObjectURL(e.target.files[0]));
  });
  document.getElementById('product-form')?.querySelector('input[name="image"]')?.addEventListener('change', e => {
    if (e.target.files[0]) showProductPreview(URL.createObjectURL(e.target.files[0]));
  });
  document.getElementById('category-form')?.querySelector('input[name="image"]')?.addEventListener('change', e => {
    if (e.target.files[0]) showCategoryPreview(URL.createObjectURL(e.target.files[0]));
  });
  document.getElementById('offer-form')?.querySelector('input[name="image"]')?.addEventListener('change', e => {
    if (e.target.files[0]) showOfferPreview(URL.createObjectURL(e.target.files[0]));
  });
});
