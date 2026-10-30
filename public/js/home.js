/* Supreme homepage: 6 random products with a Large/Compact/List toggle. */
(function () {
  var grid = document.getElementById('inv-grid');
  if (!grid) return;
  var LIMIT = 6, WA = '254759929222';
  var PH = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#1a1a1a"/><text x="50%" y="50%" fill="#d32f2f" font-family="Arial, sans-serif" font-size="26" font-weight="900" text-anchor="middle" dominant-baseline="middle">SUPREME AUTO PARTS</text></svg>');
  function money(n) { return 'KSh ' + Number(n || 0).toLocaleString(); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null && text !== '') e.textContent = text; return e; }
  function pic(p) {
    var i = document.createElement('img'); i.src = p.image || PH; i.alt = p.name || ''; i.loading = 'lazy';
    i.onerror = function () { i.onerror = null; i.src = PH; };
    return i;
  }

  var mode = 'bg', picked = [];
  try { mode = localStorage.getItem('supreme_view') || 'bg'; } catch (e) {}
  if (['bg', 'sg', 'l'].indexOf(mode) < 0) mode = 'bg';
  var toggles = document.querySelectorAll('.view-toggle button');

  function card(p) {
    var c = el('article', 'inv-card');
    var a = el('a', 'inv-img'); a.href = '/product.html?id=' + p.id; a.setAttribute('aria-label', p.name || 'Product'); a.append(pic(p));
    var b = el('div', 'inv-body');
    b.append(el('span', 'inv-cat', p.category_name || 'Universal'));
    var h = el('h3'); var l = el('a', '', p.name); l.href = a.href; h.append(l); b.append(h);
    var meta = [p.brand, [p.car_make, p.car_model].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
    if (meta) b.append(el('p', 'inv-meta', meta));
    b.append(el('div', 'inv-price', money(p.price)));
    var act = el('div', 'inv-actions');
    var add = el('button', 'inv-add', 'Add to Cart'); add.type = 'button';
    add.addEventListener('click', function () { if (typeof addToCart === 'function') addToCart(p); });
    var wa = el('a', 'inv-wa', '💬'); wa.target = '_blank'; wa.rel = 'noopener'; wa.setAttribute('aria-label', 'Order on WhatsApp');
    wa.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hi Supreme Auto Parts, I want to order: ' + p.name + ' (' + money(p.price) + ')');
    act.append(add, wa); b.append(act); c.append(a, b);
    return c;
  }

  function render() {
    grid.className = 'inv-grid view-' + mode;
    grid.textContent = '';
    if (!picked.length) grid.append(el('p', '', 'No products yet.'));
    picked.forEach(function (p) { grid.append(card(p)); });
    toggles.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === mode)); });
  }
  toggles.forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.dataset.view;
      try { localStorage.setItem('supreme_view', mode); } catch (e) {}
      render();
    });
  });

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  grid.append(el('p', '', 'Loading…'));
  fetch('/api/products').then(function (r) { return r.json(); }).then(function (rows) {
    rows = Array.isArray(rows) ? rows : [];
    var withImg = rows.filter(function (p) { return /^https?:/.test(p.image || ''); });
    var pool = withImg.length >= LIMIT ? withImg : rows;
    picked = shuffle(pool.slice()).slice(0, LIMIT);
    render();
  }).catch(function () { grid.textContent = ''; grid.append(el('p', '', 'Could not load products. Please refresh.')); });
})();
