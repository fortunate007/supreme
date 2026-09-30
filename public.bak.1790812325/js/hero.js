(function(){
  const q = s => document.querySelector(s);
  const ready = fn => document.readyState!=='loading' ? fn() : document.addEventListener('DOMContentLoaded', fn);

  const DEFAULT_HERO = '/uploads/hero/hero.jpg';
  const DEFAULT_TITLE = 'Genuine Auto Parts & Accessories';
  const DEFAULT_SUB   = 'Everything your car needs — engine, body, electrical, interior. Quality parts, honest prices, fast delivery across East Africa.';
  const DEFAULT_KICKER = 'Accessories Collection';

  function build(s){
    const img    = s.hero_image || DEFAULT_HERO;
    const kicker = s.hero_kicker || DEFAULT_KICKER;
    const title  = s.hero_title  || DEFAULT_TITLE;
    const sub    = s.hero_sub    || DEFAULT_SUB;
    const wa     = String(s.whatsapp || s.phone || '254700000000').replace(/[^0-9]/g,'');
    const shop   = s.hero_shop_url || '#shop-all';

    const banner = document.createElement('section');
    banner.className = 'hero-banner';
    banner.setAttribute('aria-label','Accessories collection hero');
    banner.innerHTML = `
      <img src="${img}" alt="Auto parts and accessories collection" loading="eager"
           onerror="this.src='/uploads/placeholder/placeholder.png'">
      <div class="hero-overlay"></div>
      <div class="hero-inner">
        <span class="hero-kicker">${kicker}</span>
        <h1>${title}</h1>
        <p>${sub}</p>
        <div class="hero-cta">
          <a class="btn-primary" href="${shop}">🛒 Shop Accessories</a>
          <a class="btn-ghost" target="_blank" rel="noopener"
             href="https://wa.me/${wa}?text=${encodeURIComponent('Hi Supreme Auto Parts, I need help choosing parts for my car.')}">
             💬 Talk to Us
          </a>
        </div>
      </div>`;
    return banner;
  }

  function inject(s){
    if (q('.hero-banner')) {
      // replace existing hero image if settings changed
      const i = q('.hero-banner img');
      if (i && s.hero_image && i.getAttribute('src') !== s.hero_image){
        i.src = s.hero_image;
      }
      return;
    }
    const header = q('header');
    const main   = q('main') || document.body;
    const first  = main.firstElementChild;
    const banner = build(s);
    if (header && header.parentElement){
      header.parentElement.insertBefore(banner, header.nextSibling);
    } else if (first){
      main.insertBefore(banner, first);
    } else {
      main.insertBefore(banner, main.firstChild);
    }
  }

  ready(async ()=>{
    let s = {};
    try { s = await (await fetch('/api/settings')).json(); } catch(e){}
    inject(s);
  });
})();
