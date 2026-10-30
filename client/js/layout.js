/* Supreme shared layout (Zen-style). Replaces each page's old banner, header, drawer, WhatsApp button and footer. */
(function () {
  var WA = '254759929222', WA_TXT = '+254 759 929 222';
  var EMAIL = 'info@supremeaccessories.com';
  var ADDR = 'Kirinyaga Road, next to Kingdom Bank, Nairobi';
  var path = location.pathname.replace(/index\.html$/, '');
  function cur(h) { return path === h ? ' aria-current="page"' : ''; }

  document.querySelectorAll('.top-banner, header.header, #overlay, #side-menu, .wa-float, footer.footer').forEach(function (el) { el.remove(); });
  document.querySelectorAll('header').forEach(function (h) {
    if (h.querySelector('a[href$="cart.html"], #menu-btn')) h.remove();
  });

  var head = `
<div class="zx-bar"><div class="zx-bar-in">
  <div class="zx-bar-left">
  <a href="/contact.html">📍 ${ADDR}</a>
  <a href="mailto:${EMAIL}">✉️ ${EMAIL}</a>
  <a href="https://wa.me/${WA}" target="_blank" rel="noopener">📞 ${WA_TXT}</a>
</div>
  <a class="zx-admin" href="/admin.html">🔐 Admin</a>
</div></div>
<header class="zx-header"><div class="zx-inner">
  <button id="menu-btn" class="zx-menu-btn" aria-label="Open menu">☰</button>
  <a href="/" class="zx-logo">SUPREME <span>AUTO PARTS</span></a>
  <nav class="zx-nav" aria-label="Main">
    <a class="zx-link" href="/"${cur('/')}>Home</a>
    <a class="zx-link" href="/products.html"${cur('/products.html')}>Shop</a>
    <a class="zx-link" href="/offers.html"${cur('/offers.html')}>Offers</a>
    <a class="zx-link" href="/faqs.html"${cur('/faqs.html')}>FAQs</a>
    <a class="zx-link" href="/about.html"${cur('/about.html')}>About</a>
    <a class="zx-link" href="/contact.html"${cur('/contact.html')}>Contact</a>
    <a href="/cart.html"${cur('/cart.html')}>Cart <span id="cart-count" class="zx-count">0</span></a>
    <button type="button" class="zx-inq" data-open-inquiry>SEND INQUIRY</button>
  </nav>
</div></header>
<div id="overlay" class="overlay"></div>
<aside id="side-menu" class="side-menu">
  <div class="side-menu-header"><h2>Menu</h2><button onclick="toggleMenu()" aria-label="Close menu">✕</button></div>
  <a href="/" class="menu-item highlight">🏠 Home</a>
  <a href="/products.html" class="menu-item">🛒 Shop All</a>
  <a href="/offers.html" class="menu-item highlight">🔥 Offers</a>
  <a href="/products.html?universal=1" class="menu-item">🌍 Universal Parts</a>
  <a href="#" class="menu-item" data-open-inquiry>✉️ Send Inquiry</a>
  <a href="/faqs.html" class="menu-item">❓ FAQs</a>
  <a href="/about.html" class="menu-item">ℹ️ About</a>
  <a href="/contact.html" class="menu-item">📞 Contact</a>
  <a href="/admin.html" class="menu-item">🔐 Admin</a>
  <div class="menu-divider"></div>
  <div id="category-menu" class="category-menu"></div>
</aside>`;

  var foot = `
<a class="zx-wa" href="https://wa.me/${WA}" target="_blank" rel="noopener" title="Chat on WhatsApp" aria-label="Chat on WhatsApp">💬</a>
<footer class="zx-footer"><div class="zx-wrap">
  <div class="zx-foot-grid">
    <div><h4>Supreme Auto Parts</h4><a href="mailto:${EMAIL}">✉️ ${EMAIL}</a><a href="https://wa.me/${WA}" target="_blank" rel="noopener">📞 ${WA_TXT}</a><a href="/contact.html">📍 ${ADDR}</a></div>
    <div><h4>Open Hours</h4><p>Monday to Saturday<br>8:00 AM – 6:00 PM</p></div>
    <div><h4>Navigation</h4><a href="/">Home</a><a href="/products.html">Shop</a><a href="/offers.html">Offers</a><a href="/faqs.html">FAQs</a><a href="/about.html">About</a><a href="/contact.html">Contact</a></div>
  </div>
  <div class="zx-foot-bottom">© ${new Date().getFullYear()} Supreme Auto Parts. All rights reserved.</div>
</div></footer>`;

  var modal = `
<div id="inq-backdrop" class="inq-backdrop" hidden>
  <div class="inq-modal" role="dialog" aria-modal="true" aria-labelledby="inq-title">
    <button type="button" class="inq-close" aria-label="Close" data-close-inquiry>✕</button>
    <div id="inq-form-wrap">
      <h3 id="inq-title">Send an Inquiry</h3>
      <p class="inq-sub">Tell us what you need and we will get back to you.</p>
      <form id="inq-form" novalidate>
        <input type="text" name="website" class="inq-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        <label>Full name<input name="name" required autocomplete="name"></label>
        <label>Phone / WhatsApp<input name="phone" type="tel" required autocomplete="tel"></label>
        <label>Email (optional)<input name="email" type="email" autocomplete="email"></label>
        <label>Subject<select name="subject"><option>Part inquiry</option><option>Import on order</option><option>Delivery</option><option>Warranty</option><option>General question</option></select></label>
        <label>How soon do you need it?<select name="timeline"><option>Immediately</option><option>This week</option><option>Just inquiring</option></select></label>
        <label>Message<textarea name="message" rows="4" required placeholder="Part name, car make, model and year"></textarea></label>
        <p id="inq-error" class="inq-error" role="alert"></p>
        <button class="inq-send" type="submit" id="inq-submit">Send Inquiry</button>
      </form>
    </div>
    <div id="inq-done" hidden>
      <h3>Inquiry sent ✅</h3>
      <p class="inq-sub">Thank you. We will contact you shortly. For a faster reply, continue on WhatsApp.</p>
      <a id="inq-wa" class="inq-send inq-green" target="_blank" rel="noopener">Continue on WhatsApp</a>
    </div>
  </div>
</div>`;

  var css = document.createElement('style');
  css.textContent = `
body{padding-top:0!important}
html{scroll-padding-top:80px}
.zx-wrap{max-width:1200px;margin:0 auto;padding:0 1rem}
.zx-bar{background:#0b0d12;color:#cfd3dc;font-size:.82rem}
.zx-bar-in{max-width:1200px;margin:0 auto;padding:.45rem 1rem;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.3rem 1rem}
.zx-bar-left{display:flex;flex-wrap:wrap;gap:.3rem 1.6rem}
.zx-bar a{color:#cfd3dc;text-decoration:none}
.zx-bar a:hover{color:#fff}
.zx-bar .zx-admin{font-weight:700;color:#fff;border:1px solid #4a4f5c;border-radius:999px;padding:.1rem .8rem}
.zx-bar .zx-admin:hover{background:#d32f2f;border-color:#d32f2f}
@media(max-width:640px){.zx-bar-left a:first-child{display:none}.zx-bar-in{justify-content:center}}
.zx-header{position:sticky;top:0;z-index:900;background:#14171f;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.zx-inner{max-width:1200px;margin:0 auto;padding:.6rem 1rem;display:flex;align-items:center;gap:1rem}
.zx-menu-btn{background:#fff;color:#14171f;border:0;border-radius:8px;width:42px;height:42px;font-size:1.3rem;cursor:pointer}
.zx-logo{font-weight:800;letter-spacing:.04em;color:#fff;text-decoration:none;font-size:1.15rem;white-space:nowrap}
.zx-logo span{color:#e53935}
.zx-nav{margin-left:auto;display:flex;align-items:center;gap:1.1rem}
.zx-nav a{color:#fff;text-decoration:none;font-weight:600;font-size:.92rem}
.zx-nav a:hover,.zx-nav a[aria-current]{color:#ff6b66}
.zx-count{background:#e53935;color:#fff;border-radius:999px;font-size:.72rem;padding:.05rem .45rem;margin-left:.2rem}
@media(max-width:940px){.zx-nav .zx-link{display:none}}
.zx-inq{background:#d32f2f;color:#fff;border:0;border-radius:6px;padding:.5rem 1rem;font:inherit;font-size:.85rem;font-weight:700;letter-spacing:.04em;cursor:pointer;white-space:nowrap}
.zx-inq:hover{background:#b71c1c}
.zx-inq:focus-visible,.zx-menu-btn:focus-visible{outline:2px solid #ff6b66;outline-offset:2px}
.zx-wa{position:fixed;right:1.1rem;bottom:1.1rem;width:54px;height:54px;border-radius:50%;background:#25d366;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.5rem;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.3);z-index:800}
.zx-footer{background:#14171f;color:#cfd3dc;margin-top:2.5rem;padding:2rem 0 1rem}
.zx-foot-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.5rem}
.zx-footer h4{color:#fff;margin:0 0 .6rem}
.zx-footer a{display:block;color:#cfd3dc;text-decoration:none;margin:.25rem 0;font-size:.9rem}
.zx-footer a:hover{color:#fff}
.zx-footer p{margin:0;font-size:.9rem}
.zx-foot-bottom{border-top:1px solid #2a2f3a;margin-top:1.5rem;padding-top:1rem;font-size:.82rem;text-align:center}
.inq-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:1rem;z-index:2000}
.inq-backdrop[hidden]{display:none}
.inq-modal{position:relative;background:#fff;color:#222;width:100%;max-width:460px;max-height:92vh;overflow:auto;border-radius:12px;padding:1.4rem;box-shadow:0 20px 50px rgba(0,0,0,.3)}
.inq-modal h3{margin:0 0 .25rem;font-size:1.2rem}
.inq-sub{margin:0 0 1rem;color:#666;font-size:.9rem}
.inq-modal label{display:block;font-size:.85rem;font-weight:600;margin-bottom:.7rem}
.inq-modal input,.inq-modal select,.inq-modal textarea{display:block;width:100%;margin-top:.25rem;padding:.55rem .65rem;border:1px solid #ccc;border-radius:8px;font:inherit;font-weight:400;box-sizing:border-box}
.inq-close{position:absolute;top:.6rem;right:.7rem;background:none;border:0;font-size:1.2rem;cursor:pointer;color:#555}
.inq-hp{position:absolute!important;left:-9999px;width:1px!important;height:1px!important;opacity:0}
.inq-error{color:#c62828;font-size:.85rem;min-height:1.1em;margin:.2rem 0 .6rem}
.inq-send{display:block;width:100%;text-align:center;box-sizing:border-box;background:#d32f2f;color:#fff;border:0;border-radius:8px;padding:.7rem;font:inherit;font-weight:700;cursor:pointer;text-decoration:none}
.inq-green{background:#25d366}`;
  document.head.appendChild(css);

  var me = document.currentScript;
  document.body.insertAdjacentHTML('afterbegin', head);
  me.insertAdjacentHTML('beforebegin', foot + modal);

  var back = document.getElementById('inq-backdrop'), form = document.getElementById('inq-form');
  var wrap = document.getElementById('inq-form-wrap'), done = document.getElementById('inq-done');
  var err = document.getElementById('inq-error'), btn = document.getElementById('inq-submit');
  var lastFocus = null;

  function openInq() {
    lastFocus = document.activeElement;
    var side = document.getElementById('side-menu');
    if (side && side.classList.contains('open') && window.toggleMenu) window.toggleMenu();
    var msg = form.elements['message'];
    if (!msg.value) {
      var h = document.querySelector('#product-detail h1');
      if (h) msg.value = "I'm interested in: " + h.textContent.trim();
    }
    wrap.hidden = false; done.hidden = true; err.textContent = '';
    back.hidden = false; document.body.style.overflow = 'hidden';
    setTimeout(function () { form.elements['name'].focus(); }, 30);
  }
  function closeInq() {
    back.hidden = true; document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-open-inquiry]')) { e.preventDefault(); openInq(); }
    else if (e.target.closest('[data-close-inquiry]') || e.target === back) closeInq();
  });
  document.addEventListener('keydown', function (e) {
    if (back.hidden) return;
    if (e.key === 'Escape') { closeInq(); return; }
    if (e.key !== 'Tab') return;
    var els = Array.from(back.querySelectorAll('button, input:not(.inq-hp), select, textarea, a[href]'))
      .filter(function (el) { return el.offsetParent !== null; });
    if (!els.length) return;
    var first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  form.addEventListener('submit', async function (e) {
    e.preventDefault(); err.textContent = '';
    var d = Object.fromEntries(new FormData(form));
    if (!d.name.trim() || !d.phone.trim() || !d.message.trim()) { err.textContent = 'Please fill in your name, phone and message.'; return; }
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      var r = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(j.error || 'Could not send. Please try again.');
      document.getElementById('inq-wa').href = 'https://wa.me/' + WA + '?text=' +
        encodeURIComponent('Hi Supreme Auto Parts, ' + d.subject + '. ' + d.message + '\nName: ' + d.name + '\nPhone: ' + d.phone);
      wrap.hidden = true; done.hidden = false; form.reset();
    } catch (x) { err.textContent = x.message; }
    btn.disabled = false; btn.textContent = 'Send Inquiry';
  });

  // pages that do not load app.js still need a working menu button
  document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('script[src*="/js/app.js"]')) return;
    if (!window.toggleMenu) window.toggleMenu = function () {
      var s = document.getElementById('side-menu'), o = document.getElementById('overlay');
      if (s) s.classList.toggle('open'); if (o) o.classList.toggle('show');
    };
    var b = document.getElementById('menu-btn'), o2 = document.getElementById('overlay');
    if (b) b.addEventListener('click', window.toggleMenu);
    if (o2) o2.addEventListener('click', window.toggleMenu);
  });
})();
