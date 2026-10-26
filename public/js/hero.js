/* Supreme homepage hero: featured products, auto-advancing every 2 seconds. */
(function () {
  var root = document.getElementById('hero');
  if (!root) return;
  var DELAY = 2000;
  var PH = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#1a1a1a"/><text x="50%" y="50%" fill="#d32f2f" font-family="Arial, sans-serif" font-size="26" font-weight="900" text-anchor="middle" dominant-baseline="middle">SUPREME AUTO PARTS</text></svg>');
  function money(n) { return 'KSh ' + Number(n || 0).toLocaleString(); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null && text !== '') e.textContent = text; return e; }

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var idx = 0, timer = null, userPaused = reduce, hover = false;
  var slides = [], dots = [], track = null, pauseBtn = null;

  function show(i) {
    idx = (i + slides.length) % slides.length;
    track.style.transform = 'translateX(' + (-idx * 100) + '%)';
    slides.forEach(function (s, n) {
      var on = n === idx;
      s.setAttribute('aria-hidden', String(!on));
      s.tabIndex = on ? 0 : -1;
      dots[n].setAttribute('aria-current', on ? 'true' : 'false');
    });
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
      var cap = el('div', 'zh-cap');
      cap.append(el('span', 'zh-tag', 'Featured'), el('h2', '', p.name),
                 el('p', '', p.description || p.category_name || ''),
                 el('strong', 'zh-price', money(p.price)), el('span', 'zh-link', 'View Details →'));
      var img = document.createElement('img');
      img.src = p.image || PH; img.alt = ''; img.decoding = 'async';
      if (n > 0) img.loading = 'lazy';
      img.onerror = function () { img.onerror = null; img.src = PH; };
      a.append(cap, img); track.append(a); slides.push(a);
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
    var dotWrap = el('div', 'zh-dots');
    list.forEach(function (p, n) {
      var d = el('button', 'zh-dot'); d.type = 'button'; d.setAttribute('aria-label', 'Go to slide ' + (n + 1));
      d.addEventListener('click', function () { show(n); start(); });
      dots.push(d); dotWrap.append(d);
    });
    ctrl.append(pauseBtn, dotWrap);
    root.append(prev, next, ctrl);
    setPauseUi();

    root.addEventListener('mouseenter', function () { hover = true; });
    root.addEventListener('mouseleave', function () { hover = false; });
    root.addEventListener('focusin', function () { hover = true; });
    root.addEventListener('focusout', function () { hover = false; });
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
    var withImg = rows.filter(function (p) { return /^https?:/.test(p.image || ''); });
    var list = (withImg.length ? withImg : rows).slice(0, 6);
    if (!list.length) { root.hidden = true; return; }
    build(list); show(0); start();
  }).catch(function () { root.hidden = true; });
})();
