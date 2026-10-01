(function(){
  let SETTINGS = {};
  const WA_FALLBACK = '254700000000';
  const q  = (s,c)=> (c||document).querySelector(s);
  const qa = (s,c)=> Array.from((c||document).querySelectorAll(s));
  const ready = fn => document.readyState!=='loading' ? fn() : document.addEventListener('DOMContentLoaded', fn);
  const waNumber = () => String(SETTINGS.whatsapp || SETTINGS.phone || WA_FALLBACK).replace(/[^0-9]/g,'');

  function toast(m){
    let t = q('.pc-toast');
    if(!t){ t = document.createElement('div'); t.className='pc-toast'; document.body.appendChild(t); }
    t.textContent = m; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(()=>t.classList.remove('show'), 2200);
  }

  /* ---------- WHY SUPREME — 8 cards ---------- */
  const WHY = [
    {e:'🛡️', t:'Warranty on All Products',       d:'We offer our products with warranty — shop with confidence.'},
    {e:'🚗', t:'All Car Models',                 d:'All accessories for all car models — Toyota, Nissan, Subaru, Mazda, Mercedes, and more.'},
    {e:'🚚', t:'East Africa Delivery',           d:'We deliver all over East Africa within 72 hours.'},
    {e:'📦', t:'Import on Order',                d:'We import all parts and accessories on order.'},
    {e:'💰', t:'Best Quality, Affordable Prices',d:'Premium quality without premium pricing. Keep your repairs affordable.'},
    {e:'🔧', t:'Expert Consultation',            d:'Not sure what fits? Our team guides you to the right part for your vehicle.'},
    {e:'🛠️', t:'After-Sale Services',            d:'We do installation for the products you shop from us. Walk in, drive out.'},
    {e:'⭐', t:'Trusted by Drivers',             d:'Years of service to drivers across Kenya — genuine parts, honest advice.'}
  ];

  function renderWhy(){
    let target = null;
    qa('h1,h2,h3,h4').forEach(h=>{
      if (/why\s*(supreme|us|choose)/i.test(h.textContent||'')){
        target = h.closest('section') || h.parentElement;
      }
    });
    if (!target){
      const hero = q('.hero, #hero, header + section, main > section:first-child');
      const host = hero ? hero.parentElement : document.body;
      target = document.createElement('section');
      if (hero) host.insertBefore(target, hero.nextSibling);
      else host.insertBefore(target, host.firstChild);
    }
    if (target.dataset.whyDone === '1') return;
    target.dataset.whyDone = '1';
    target.classList.add('why-block');
    target.innerHTML = `
      <div class="why-wrap">
        <h2>Why Supreme Auto Parts?</h2>
        <p class="why-sub">Kenya's trusted partner for genuine auto parts & fitment services.</p>
        <div class="why-grid">
          ${WHY.map(w=>`
            <div class="why-card">
              <span class="why-emoji">${w.e}</span>
              <h3>${w.t}</h3>
              <p>${w.d}</p>
            </div>`).join('')}
        </div>
      </div>`;
  }

  /* ---------- SHOP ALL ---------- */
  function findShopHost(){
    for (const h of qa('h1,h2,h3')){
      const t = (h.textContent||'').trim().toLowerCase();
      if (/(shop\s*by\s*categor|^categories$|^products$|shop\s*all|our\s*products|shop\s*now)/.test(t)){
        return h.closest('section') || h.parentElement;
      }
    }
    for (const c of qa('section,#shop,#products,.shop,.products-section')){
      if (c.querySelectorAll('[data-product],.product-card,.product,.product-item').length) return c;
    }
    const hero = q('.hero, #hero, header + section');
    const host = hero ? hero.parentElement : document.body;
    const s = document.createElement('section');
    if (hero) host.insertBefore(s, hero.nextSibling); else host.insertBefore(s, host.firstChild);
    return s;
  }

  function productImgUrl(p){
    if (p.image) return '/uploads/products/' + p.image;
    if (p.img)   return p.img;
    return '/uploads/placeholder/placeholder.png';
  }

  async function loadProducts(){
    for (const url of ['/api/products','/api/shop/products','/api/items','/api/all/products']){
      try{
        const r = await fetch(url);
        if (!r.ok) continue;
        const j = await r.json();
        const list = Array.isArray(j) ? j : (j.products || j.data || j.items || []);
        if (list.length) return list;
      }catch(e){}
    }
    return [];
  }

  async function renderShop(){
    const host = findShopHost();
    if (!host || host.dataset.shopRendered === '1') return;
    host.dataset.shopRendered = '1';
    host.classList.add('shop-section');

    const products = await loadProducts();
    const wa = waNumber();
    const head = document.createElement('div');
    head.className = 'shop-head';
    head.innerHTML = '<h2>Shop All</h2>';

    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    if (!products.length){
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;opacity:.7">No products yet — add some from the admin panel.</p>';
    } else {
      grid.innerHTML = products.map(p=>{
        const name  = p.name || p.title || 'Product';
        const price = p.price != null ? (isNaN(p.price) ? p.price : 'KSh ' + Number(p.price).toLocaleString()) : '';
        const desc  = p.description || p.desc || '';
        const id    = p.id != null ? p.id : name;
        const msg   = encodeURIComponent(`Hi Supreme Auto Parts, I'm interested in: ${name}${price?` (${price})`:''}`);
        return `
          <div class="product-card" data-id="${id}">
            <div class="pc-media"><img loading="lazy" alt="${name}" src="${productImgUrl(p)}"
                 onerror="this.src='/uploads/placeholder/placeholder.png'"></div>
            <div class="pc-body">
              <div class="pc-name">${name}</div>
              ${desc?`<p class="pc-desc">${desc}</p>`:''}
              ${price?`<div class="pc-price">${price}</div>`:''}
              <div class="pc-actions">
                <button class="pc-cart" type="button">Add to Cart</button>
                <a class="pc-wa" target="_blank" rel="noopener" aria-label="WhatsApp inquiry"
                   href="https://wa.me/${wa}?text=${msg}">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11 11 0 0 0 2.1 17.2L1 23l5.9-1.1A11 11 0 1 0 20.5 3.5zM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.5.6.6-3.4-.2-.3A9 9 0 1 1 12 21zm5-6.6c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.9 1.1-.1.2-.3.2-.6.1a7 7 0 0 1-2-1.2 7.7 7.7 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.1-.3 0-.5s-.6-1.4-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.3.3-1 1-1 2.3s1 2.7 1.2 2.9a10 10 0 0 0 4 3.5c.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.1-1.3 0 0-.2-.1-.5-.2z"/></svg>
                </a>
              </div>
            </div>
          </div>`;
      }).join('');
    }

    host.innerHTML = '';
    host.appendChild(head);
    host.appendChild(grid);

    qa('.pc-cart', grid).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const card = btn.closest('.product-card');
        addToCart({
          id:    card.dataset.id,
          name:  q('.pc-name', card)?.textContent || '',
          price: q('.pc-price', card)?.textContent || '',
          image: q('img', card)?.getAttribute('src') || ''
        });
      });
    });

    revealInfinite(grid);
  }

  function addToCart(p){
    try{
      const key='supreme_cart_v1';
      const cart = JSON.parse(localStorage.getItem(key)||'[]');
      const f = cart.find(x=>String(x.id)===String(p.id));
      if (f) f.qty=(f.qty||1)+1; else cart.push(Object.assign({},p,{qty:1}));
      localStorage.setItem(key, JSON.stringify(cart));
      toast('Added: ' + (p.name||'item') + ' ✔');
      document.dispatchEvent(new CustomEvent('cart:updated',{detail:cart}));
    }catch(e){ toast('Could not add to cart'); }
  }

  function revealInfinite(grid){
    const cards = qa('.product-card', grid);
    cards.forEach((c,i)=>{ if(i>=8){ c.style.display='none'; c.dataset.hidden='1'; } });
    if (window.__supremeInf) return;
    window.__supremeInf = true;
    window.addEventListener('scroll', ()=>{
      if (window.innerHeight + window.scrollY < document.body.offsetHeight - 500) return;
      qa('[data-hidden]').slice(0,4).forEach(h=>{ h.style.display=''; delete h.dataset.hidden; });
    }, { passive:true });
  }

  function orderSections(){
    const shop = q('.shop-section');
    const why  = q('.why-block');
    const hero = q('.hero, #hero, header + section');
    if (!shop || !hero) return;
    const host = hero.parentElement;
    const anchor = (why && why.parentElement === host) ? why.nextSibling : hero.nextSibling;
    if (anchor !== shop) host.insertBefore(shop, anchor);
  }

  ready(async ()=>{
    try{ SETTINGS = await (await fetch('/api/settings')).json(); }catch(e){}
    renderWhy();
    await renderShop();
    orderSections();
    setTimeout(()=>{ renderWhy(); renderShop(); orderSections(); }, 1200);
  });
})();
