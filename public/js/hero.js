/* Supreme homepage hero: every product, in random order, one slide every 2 seconds. */
(function () {
  var root = document.getElementById('hero');
  if (!root) return;
  var DELAY = 2000;
  var ONLY_WITH_PHOTO = true;   // false = also show products that have no photo
  var PRELOAD = 2;              // photos are loaded for the current slide and this many ahead
  var PH = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#1a1a1a"/><text x="50%" y="50%" fill="#d32f2f" font-family="Arial, sans-serif" font-size="26" font-weight="900" text-anchor="middle" dominant-baseline="middle">SUPREME AUTO PARTS</text></svg>');
  function money(n) { return 'KSh ' + Number(n || 0).toLocaleString(); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null && text !== '') e.textContent = text; return e; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  var st = document.createElement('style');
  st.textContent = '.zh-count{background:rgba(20,23,31,.75);color:#fff;border-radius:999px;padding:.2rem .7rem;font-size:.8rem;font-weight:600;min-width:4.2rem;text-align:center}';
  document.head.appendChild(st);

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var idx = 0, timer = null, userPaused = reduce, hover = false;
  var slides = [], imgs = [], track = null, pauseBtn = null, counter = null;

  function loadAround(i) {
    for (var k = 0; k <= PRELOAD; k++) {
      var im = imgs[(i + k) % slides.length];
      if (im && !im.getAttribute('src') && im.dataset.src) im.src = im.dataset.src;
    }
  }
  function show(i, instant) {
    var n = slides.length, old = idx;
    var next = ((i % n) + n) % n;
    var far = Math.abs(next - old) > 1;           // wrap-around or a jump: do not sweep across every slide
    idx = next;
    loadAround(idx);
    if (far || instant) track.style.transition = 'none';
    track.style.transform = 'translateX(' + (-idx * 100) + '%)';
    if (far || instant) { void track.offsetWidth; track.style.transition = reduce ? 'none' : ''; }
    slides[old].setAttribute('aria-hidden', 'true'); slides[old].tabIndex = -1;
    slides[idx].setAttribute('aria-hidden', 'false'); slides[idx].tabIndex = 0;
    if (counter) counter.textContent = (idx + 1) + ' / ' + n;
  }
  function tick() { if (!userPaused && !hover && !document.hidden) show(idx + 1); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function start() { stop(); if (slides.length > 1) timer = setInterval(tick, DELAY); }
  function setPauseUi() {
    pauseBtn.textContent = userPaused ? '▶' : '❚❚';
    pauseBtn.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
  }

  function build(list) {
    root.textContent = '';
    var vp = el('div', 'zh-viewport');
    track = el('div', 'zh-track');
    if (reduce) track.style.transition = 'none';
    vp.append(track);

    list.forEach(function (p, n) {
      var a = el('a', 'zh-slide'); a.href = '/product.html?id=' + p.id;
      a.setAttribute('role', 'group'); a.setAttribute('aria-roledescription', 'slide');
      a.setAttribute('aria-label', (n + 1) + ' of ' + list.length + ': ' + (p.name || 'Product'));
      a.setAttribute('aria-hidden', 'true'); a.tabIndex = -1;
      var cap = el('div', 'zh-cap');
      cap.append(el('span', 'zh-tag', 'Featured'), el('h2', '', p.name),
                 el('p', '', p.description || p.category_name || ''),
                 el('strong', 'zh-price', money(p.price)), el('span', 'zh-link', 'View Details →'));
      var img = document.createElement('img');
      img.alt = ''; img.decoding = 'async'; img.dataset.src = p.image || PH;
      img.onerror = function () { img.onerror = null; img.src = PH; };
      a.append(cap, img); track.append(a); slides.push(a); imgs.push(img);
    });
    root.append(vp);
    if (list.length < 2) return;

    var prev = el('button', 'zh-nav zh-prev', '‹'); prev.type = 'button'; prev.setAttribute('aria-label', 'Previous slide');
    var next = el('button', 'zh-nav zh-next', '›'); next.type = 'button'; next.setAttribute('aria-label', 'Next slide');
    prev.addEventListener('click', function () { show(idx - 1); start(); });
    next.addEventListener('click', function () { show(idx + 1); start(); });
    var ctrl = el('div', 'zh-ctrl');
    pauseBtn = el('button', 'zh-pause'); pauseBtn.type = 'button';
    pauseBtn.addEventListener('click', function () { userPaused = !userPaused; setPauseUi(); });
    counter = el('span', 'zh-count');
    ctrl.append(pauseBtn, counter);
    root.append(prev, next, ctrl);
    setPauseUi();

    root.addEventListener('mouseenter', function () { hover = true; });
    root.addEventListener('mouseleave', function () { hover = false; });
    root.addEventListener('focusin', function () { hover = true; });
    root.addEventListener('focusout', function () { hover = false; });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(idx - 1); start(); }
      else if (e.key === 'ArrowRight') { show(idx + 1); start(); }
    });
    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { show(idx + (dx < 0 ? 1 : -1)); start(); }
    });
  }

  fetch('/api/products').then(function (r) { return r.json(); }).then(function (rows) {
    rows = Array.isArray(rows) ? rows : [];
    var list = ONLY_WITH_PHOTO ? rows.filter(function (p) { return /^https?:/.test(p.image || ''); }) : rows;
    if (!list.length) list = rows;
    if (!list.length) { root.hidden = true; return; }
    build(shuffle(list.slice()));
    show(0, true); start();
  }).catch(function () { root.hidden = true; });
})();
