/* Supreme shared layout: header, side menu, footer, Send Inquiry. Loads before app.js. */
(function () {
  var WA = '254759929222', WA_TXT = '+254 759 929 222';
  var EMAIL = 'info@supremeautoparts.co.ke';
  var ADDR = 'Kirinyaga Road, next to Kingdom Bank, Nairobi';
  var path = location.pathname;
  function cur(h) { return path === h ? ' class="active" aria-current="page"' : ''; }

  var head = `
<div class="top-banner"><div class="scroll">
  <span>📍 ${ADDR}</span>
  <span>📞 WhatsApp: ${WA_TXT}</span>
  <span>📧 ${EMAIL}</span>
  <span>🕒 Mon – Sat: 8:00 AM – 6:00 PM</span>
  <span>🚚 East Africa Delivery Within 72 Hours</span>
  <span>🛡️ Warranty on All Products</span>
</div></div>
<header class="header"><div class="container header-inner">
  <button id="menu-btn" class="menu-btn" aria-label="Open menu">☰</button>
  <a href="/" class="logo">SUPREME <span>AUTO PARTS</span></a>
  <nav class="nav" aria-label="Main">
    <a href="/"${cur('/')}>Home</a>
    <a href="/products.html"${cur('/products.html')}>Shop</a>
    <a href="/offers.html"${cur('/offers.html')}>Offers</a>
    <a href="/faqs.html"${cur('/faqs.html')}>FAQs</a>
    <a href="/contact.html"${cur('/contact.html')}>Contact</a>
    <a href="/cart.html"${cur('/cart.html')}>Cart <span id="cart-count" class="cart-count">0</span></a>
  </nav>
</div></header>
<div id="overlay" class="overlay"></div>
<aside id="side-menu" class="side-menu">
  <div class="side-menu-header"><h2>Menu</h2><button onclick="toggleMenu()" aria-label="Close menu">✕</button></div>
  <a href="/" class="menu-item highlight">🏠 Home</a>
  <a href="/products.html" class="menu-item">🛒 Shop All</a>
  <a href="/offers.html" class="menu-item highlight">🔥 Offers</a>
  <a href="/products.html?universal=1" class="menu-item">🌍 Universal Parts</a>
  <a href="/faqs.html" class="menu-item">❓ FAQs</a>
  <a href="/contact.html" class="menu-item">📞 Contact</a>
  <div class="menu-divider"></div>
  <div id="category-menu" class="category-menu"></div>
</aside>`;

  var foot = `
<a class="wa-float" href="https://wa.me/${WA}" target="_blank" rel="noopener" title="Chat on WhatsApp" aria-label="Chat on WhatsApp">💬</a>
<footer class="footer"><div class="container">
  <div class="footer-grid">
    <div><h4>Supreme Auto Parts</h4><p>Quality is Our Name. All car parts &amp; accessories for all car models. Serving East Africa with pride.</p></div>
    <div><h4>Quick Links</h4><a href="/products.html">Shop</a><a href="/offers.html">Offers</a><a href="/faqs.html">FAQs</a><a href="/contact.html">Contact</a></div>
    <div><h4>Contact</h4><a href="mailto:${EMAIL}">📧 ${EMAIL}</a><a href="https://wa.me/${WA}" target="_blank" rel="noopener">💬 WhatsApp: ${WA_TXT}</a><a href="/contact.html">📍 ${ADDR}</a></div>
    <div><h4>Open Hours</h4><p>Monday to Saturday<br>8:00 AM – 6:00 PM</p></div>
  </div>
  <div class="footer-bottom">© ${new Date().getFullYear()} Supreme Auto Parts. All rights reserved.</div>
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
        <button class="btn" type="submit" id="inq-submit">Send Inquiry</button>
      </form>
    </div>
    <div id="inq-done" hidden>
      <h3>Inquiry sent ✅</h3>
      <p class="inq-sub">Thank you. We will contact you shortly. For a faster reply, continue on WhatsApp.</p>
      <a id="inq-wa" class="btn green" target="_blank" rel="noopener">Continue on WhatsApp</a>
    </div>
  </div>
</div>`;

  var css = document.createElement('style');
  css.textContent = `
.inquiry-btn{padding:.45rem .9rem;font-size:.9rem;white-space:nowrap}
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
.inq-modal .btn{width:100%;text-align:center;display:block;box-sizing:border-box}`;
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
    var msg = form.elements.message;
    if (!msg.value) {
      var h = document.querySelector('#product-detail h1');
      if (h) msg.value = "I'm interested in: " + h.textContent.trim();
    }
    wrap.hidden = false; done.hidden = true; err.textContent = '';
    back.hidden = false; document.body.style.overflow = 'hidden';
    setTimeout(function () { form.elements.name.focus(); }, 30);
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
})();
