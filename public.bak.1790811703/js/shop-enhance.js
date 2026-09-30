(function(){
  let SETTINGS = {};
  const WA_FALLBACK = '254700000000';
  const q  = (s,c)=> (c||document).querySelector(s);
  const qa = (s,c)=> Array.from((c||document).querySelectorAll(s));

  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded',fn); }
  function waNumber(){ return String(SETTINGS.whatsapp||SETTINGS.phone||WA_FALLBACK).replace(/[^0-9]/g,''); }
  function toast(m){
    let t=q('.pc-toast');
    if(!t){ t=document.createElement('div'); t.className='pc-toast'; document.body.appendChild(t); }
    t.textContent=m; t.classList.add('show');
    clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2200);
  }

  /* -------- WHY SUPREME -------- */
  const WHY = [
    {t:'Quality Products',d:'Genuine, tested auto parts sourced from trusted suppliers — built to last.',i:'M20.3 4.3 12 12.6 3.7 4.3 2.3 5.7l9.7 9.7 9.7-9.7z'},
    {t:'Best Quality, Affordable Prices',d:'Premium quality without premium pricing. Keep your repairs affordable.',i:'M12 2 15 8.5 22 9.3l-5 4.9 1.2 7L12 18l-6.2 3.2L7 14.2 2 9.3l7-.8z'},
    {t:'Expert Consultation',d:'Not sure what fits? Our team guides you to the right part for your vehicle.',i:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'},
    {t:'After-Sale Services',d:'We do installation for the products you shop from us. Walk in, drive out.',i:'M22 18v-3l-4-1-3 3-6-6 3-3-1-4H8a6 6 0 0 0 0 12c1.5 0 2.9-.6 4-1.5L18 20z'}
  ];
  function rebuildWhy(){
    for(const h of qa('h1,h2,h3,h4')){
      const txt=(h.textContent||'').toLowerCase();
      if(/why\s+(supreme|choose|us)/.test(txt)){
        const section = h.closest('section') || h.parentElement;
        if(!section || section.dataset.whyDone) return;
        section.dataset.whyDone='1';
        section.classList.add('why-section');
        const icons = WHY.map(it=>`
          <div class="why-card">
            <div class="why-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="${it.i}"/></svg></div>
            <h3>${it.t}</h3><p>${it.d}</p>
          </div>`).join('');
        section.innerHTML = `
          <div class="why-wrap">
            <h2>Why Supreme Auto Parts</h2>
            <p class="why-sub">Kenya's trusted partner for genuine auto parts & fitment services.</p>
            <div class="why-grid">${icons}</div>
          </div>`;
        return;
      }
    }
  }

  /* -------- PRODUCT CARDS -------- */
  function enrichCard(card){
    if(card.dataset.enhanced) return;
    card.dataset.enhanced='1';
    card.classList.add('product-card');

    const nameEl = card.querySelector('h3,h4,.product-name,.pc-name,.name');
    const priceEl = card.querySelector('.price,.product-price,.pc-price');
    const name  = (nameEl  ? nameEl.textContent  : '').trim();
    const price = (priceEl ? priceEl.textContent : '').trim();
    const id    = card.dataset.id || card.dataset.productId || name;

    let img = card.querySelector('img');
    let media = card.querySelector('.pc-media');
    if(!media){
      media = document.createElement('div');
      media.className='pc-media';
      if(img){ img.parentNode.insertBefore(media, img); media.appendChild(img); }
      else {
        const p = document.createElement('img');
        p.src='/uploads/placeholder/placeholder.png';
        p.alt=name; p.loading='lazy';
        media.appendChild(p);
        card.insertBefore(media, card.firstChild);
      }
    }
    if(img){ img.loading='lazy'; img.alt=img.alt||name; }

    if(!card.querySelector('.pc-actions')){
      const msg = encodeURIComponent(`Hi Supreme Auto Parts, I'm interested in: ${name}${price?` (${price})`:''}`);
      const actions = document.createElement('div');
      actions.className='pc-actions';
      actions.innerHTML = `
        <button class="pc-cart" type="button">Add to Cart</button>
        <a class="pc-wa" target="_blank" rel="noopener" aria-label="WhatsApp inquiry"
           href="https://wa.me/${waNumber()}?text=${msg}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11 11 0 0 0 2.1 17.2L1 23l5.9-1.1A11 11 0 1 0 20.5 3.5zM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.5.6.6-3.4-.2-.3A9 9 0 1 1 12 21zm5-6.6c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.9 1.1-.1.2-.3.2-.6.1a7 7 0 0 1-2-1.2 7.7 7.7 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.1-.3 0-.5s-.6-1.4-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.3.3-1 1-1 2.3s1 2.7 1.2 2.9a10 10 0 0 0 4 3.5c.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.1-1.3 0 0-.2-.1-.5-.2z"/></svg>
        </a>`;
      card.appendChild(actions);
      actions.querySelector('.pc-cart').addEventListener('click', ()=>addToCart({id,name,price,image:img?img.getAttribute('src'):''}));
    }
  }

  function addToCart(p){
    try{
      const key='supreme_cart_v1';
      const cart = JSON.parse(localStorage.getItem(key)||'[]');
      const found = cart.find(x=>String(x.id)===String(p.id));
      if(found) found.qty=(found.qty||1)+1; else cart.push(Object.assign({},p,{qty:1}));
      localStorage.setItem(key, JSON.stringify(cart));
      toast('Added: '+(p.name||'item')+' ✔');
      document.dispatchEvent(new CustomEvent('cart:updated',{detail:cart}));
    }catch(e){ toast('Could not add to cart'); }
  }

  function enhanceAll(root){ qa('.product-card,[data-product],.product,.product-item', root||document).forEach(enrichCard); }

  /* -------- MOVE SHOP UP -------- */
  function moveShopUp(){
    let shop=null;
    for(const c of qa('section,#shop,#products,.shop,.products-section')){
      if(c.querySelectorAll('.product-card,[data-product],.product,.product-item').length>=2){ shop=c; break; }
    }
    if(!shop) return;
    shop.classList.add('shop-section');
    if(!shop.querySelector('.shop-head')){
      const head=document.createElement('div');
      head.className='shop-head';
      head.innerHTML='<h2>Shop Our Parts</h2>';
      shop.insertBefore(head, shop.firstChild);
    }
    const grid = shop.querySelector('.shop-grid,.products,.grid') || shop;
    if(!grid.classList.contains('shop-grid')) grid.classList.add('shop-grid');
    const parent = shop.parentElement;
    const firstAfterHeader = Array.from(parent.children).find(el=>el.tagName!=='HEADER' && el!==shop);
    if(firstAfterHeader) parent.insertBefore(shop, firstAfterHeader);
  }

  /* -------- INFINITE REVEAL -------- */
  function infiniteReveal(){
    const cards = qa('.product-card');
    if(!cards.length) return;
    cards.forEach((c,i)=>{ if(i>=8){ c.style.display='none'; c.dataset.hidden='1'; } });
    function revealNext(){
      const hidden = qa('[data-hidden]');
      if(!hidden.length) return;
      hidden.slice(0,4).forEach(h=>{ h.style.display=''; delete h.dataset.hidden; });
    }
    function onScroll(){
      if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) revealNext();
    }
    if(!window.__supremeInfScroll){
      window.__supremeInfScroll = true;
      window.addEventListener('scroll', onScroll, {passive:true});
    }
    onScroll();
  }

  /* -------- RUN + WATCH -------- */
  const mo = new MutationObserver(muts=>{
    muts.forEach(m=>m.addedNodes.forEach(n=>{ if(n.nodeType===1) enhanceAll(n); }));
  });

  ready(async ()=>{
    try{ SETTINGS = await (await fetch('/api/settings')).json(); }catch(e){}
    rebuildWhy(); moveShopUp(); enhanceAll(); infiniteReveal();
    mo.observe(document.body,{childList:true,subtree:true});
    [600,1500,3000].forEach(ms=>setTimeout(()=>{ enhanceAll(); moveShopUp(); infiniteReveal(); },ms));
  });
})();
