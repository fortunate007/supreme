/* Supreme About page: the intro block moved here from the homepage. */
(function () {
  if (!/\/about(\.html)?\/?$/.test(location.pathname)) return;
  if (document.querySelector('.zab-intro')) return;
  var host = document.querySelector('main') || document.querySelector('.container') || document.body;
  if (!host) return;
  var css = document.createElement('style');
  css.textContent = `
.zab-intro{display:flex;gap:1.5rem;align-items:center;background:#fff;border:1px solid #eee;border-radius:12px;padding:1.2rem 1.4rem;margin:1rem 0 1.5rem}
.zab-logo{width:140px;height:auto;flex:0 0 auto}
.zab-intro h2{margin:0 0 .3rem}
.zab-intro p{margin:.3rem 0}
.zab-links{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.8rem}
.zab-links a{padding:.45rem .9rem;border:1px solid #ccc;border-radius:999px;color:#222;text-decoration:none;font-size:.9rem;background:#fff}
.zab-links a:hover{border-color:#d32f2f;color:#d32f2f}
@media(max-width:560px){.zab-intro{flex-direction:column;text-align:center}.zab-links{justify-content:center}}`;
  document.head.appendChild(css);
  var hasTag = /Quality is Our Name/i.test(host.textContent || '');
  var intro = document.createElement('section'); intro.className = 'zab-intro';
  intro.innerHTML = '<img class="zab-logo" src="/img/logo.webp" alt="Supreme Auto Parts logo" width="140" height="137" onerror="this.remove()"><div><h2>Supreme Auto Parts</h2>' +
    (hasTag ? '' : '<p><strong>At Supreme Auto Spares; Quality is Our Name</strong></p>') +
    '<p>All parts &amp; accessories for all car models • Kirinyaga Road, Next to Kingdom Bank, Nairobi, Kenya • Serving East Africa</p>' +
    '<div class="zab-links"><a href="/products.html">Shop all parts</a><a href="/offers.html">Hot offers</a><a href="/contact.html">Visit our shop</a></div></div>';
  var h1 = host.querySelector('h1');
  if (h1) h1.insertAdjacentElement('afterend', intro); else host.insertAdjacentElement('afterbegin', intro);
})();
