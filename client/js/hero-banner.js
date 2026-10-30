(function () {
  var box = document.getElementById('hero-rotator');
  if (!box) return;
  function fmt(v) { return (typeof money === 'function') ? money(v) : 'KSh ' + Number(v || 0).toLocaleString('en-KE'); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  fetch('/api/products').then(function (r) { return r.json(); }).then(function (list) {
    var items = (list || []).filter(function (p) { return p && p.image; }).slice(0, 8);
    if (!items.length) { box.style.display = 'none'; return; }
    items.forEach(function (p, n) {
      var s = el('div', 'hero-slide prod-slide' + (n === 0 ? ' active' : ''));
      var link = '/product.html?id=' + encodeURIComponent(p.id);
      var a = el('a', 'prod-img'); a.href = link;
      var img = document.createElement('img');
      img.src = p.image; img.alt = p.name || ''; img.loading = 'eager';
      a.appendChild(img);
      var info = el('div', 'prod-info');
      if (p.category_name) info.appendChild(el('span', 'prod-cat', p.category_name));
      info.appendChild(el('h3', 'prod-name', p.name));
      info.appendChild(el('p', 'prod-price', fmt(p.price)));
      var btn = el('a', 'btn', 'View Product'); btn.href = link;
      info.appendChild(btn);
      s.appendChild(a); s.appendChild(info); box.appendChild(s);
    });
    var slides = [].slice.call(box.querySelectorAll('.hero-slide'));
    if (slides.length < 2) return;
    var dots = el('div', 'hero-dots');
    var i = 0, timer = null;
    slides.forEach(function (_, n) {
      var b = el('button'); b.type = 'button'; b.setAttribute('aria-label', 'Product ' + (n + 1));
      b.onclick = function () { go(n); stop(); start(); };
      dots.appendChild(b);
    });
    box.parentNode.insertBefore(dots, box.nextSibling);
    function go(n) {
      slides[i].classList.remove('active'); dots.children[i].classList.remove('on');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('active'); dots.children[i].classList.add('on');
    }
    function start() {
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      stop(); timer = setInterval(function () { go(i + 1); }, 4500);
    }
    function stop() { clearInterval(timer); }
    box.addEventListener('mouseenter', stop);
    box.addEventListener('mouseleave', start);
    dots.children[0].classList.add('on');
    start();
  }).catch(function () { box.style.display = 'none'; });
})();
