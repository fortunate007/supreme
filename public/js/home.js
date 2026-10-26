/* Supreme homepage: featured row, inventory with view toggle, per-page and pagination. */
(function () {
  var grid = document.getElementById('inv-grid');
  if (!grid) return;
  var WA = '254759929222';
  var PH = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#1a1a1a"/><text x="50%" y="50%" fill="#d32f2f" font-family="Arial, sans-serif" font-size="26" font-weight="900" text-anchor="middle" dominant-baseline="middle">SUPREME AUTO PARTS</text></svg>');
  function money(n) { return 'KSh ' + Number(n || 0).toLocaleString(); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null && text !== '') e.textContent = text; return e; }
  function pic(p) {
    var i = document.createElement('img'); i.src = p.image || PH; i.alt = p.name || ''; i.loading = 'lazy';
    i.onerror = function () { i.onerror = null; i.src = PH; };
    return i;
  }

  var all = [], page = 1, per = 8, mode = 'bg';
  try {
    mode = localStorage.getItem('supreme_view') || 'bg';
    per = parseInt(localStorage.getItem('supreme_per'), 10) || 8;
  } catch (e) {}
  if (['bg', 'sg', 'l'].indexOf(mode) < 0) mode = 'bg';
  var pager = document.getElementById('inv-pager'), perSel = document.getElementById('inv-per');
  var toggles = document.querySelectorAll('.view-toggle button');
  perSel.value = String(per);
  if (perSel.value !== String(per)) { per = 8; perSel.value = '8'; }
  function save() { try { localStorage.setItem('supreme_view', mode); localStorage.setItem('supreme_per', per); } catch (e) {} }

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

  function featured() {
    var row = document.getElementById('feat-row'); row.textContent = '';
    all.slice(0, 4).forEach(function (p) {
      var a = el('a', 'feat-card'); a.href = '/product.html?id=' + p.id; a.append(pic(p));
      var b = el('div', 'feat-body');
      b.append(el('span', 'feat-tag', 'Featured'), el('h3', '', p.name), el('p', '', p.description || p.category_name || ''),
               el('strong', '', money(p.price)), el('span', 'feat-link', 'View Details →'));
      a.append(b); row.append(a);
    });
    document.getElementById('featured').hidden = !all.length;
  }

  function render(scroll) {
    var pages = Math.max(1, Math.ceil(all.length / per));
    page = Math.min(page, pages);
    grid.className = 'inv-grid view-' + mode;
    grid.textContent = '';
    var slice = all.slice((page - 1) * per, page * per);
    if (!slice.length) grid.append(el('p', '', 'No products yet.'));
    slice.forEach(function (p) { grid.append(card(p)); });
    toggles.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === mode)); });
    pager.textContent = '';
    if (pages > 1) {
      var add = function (label, p, off, cur) {
        var b = el('button', '', label); b.type = 'button';
        if (off) b.disabled = true;
        if (cur) b.setAttribute('aria-current', 'page');
        b.addEventListener('click', function () { page = p; render(true); });
        pager.append(b);
      };
      add('Prev', page - 1, page === 1);
      for (var i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || Math.abs(i - page) <= 1) add(String(i), i, false, i === page);
        else if (i === 2 || i === pages - 1) pager.append(el('span', '', '…'));
      }
      add('Next', page + 1, page === pages);
    }
    if (scroll) document.getElementById('inventory').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggles.forEach(function (b) { b.addEventListener('click', function () { mode = b.dataset.view; save(); render(false); }); });
  perSel.addEventListener('change', function () { per = parseInt(perSel.value, 10) || 8; page = 1; save(); render(false); });

  grid.append(el('p', '', 'Loading…'));
  fetch('/api/products').then(function (r) { return r.json(); })
    .then(function (rows) { all = Array.isArray(rows) ? rows : []; featured(); render(false); })
    .catch(function () { grid.textContent = ''; grid.append(el('p', '', 'Could not load products. Please refresh.')); });
})();
