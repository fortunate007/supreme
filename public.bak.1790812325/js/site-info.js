(function(){
  const CACHE_KEY='supreme_settings_v1';
  const MAPS='https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Kirinyaga Road, Next to Kingdom Bank, Nairobi, Kenya');

  function socialSVG(net){
    const icons = {
      facebook:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>',
      instagram:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.22.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.05.41 2.22.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.22-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.05.36-2.22.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.22-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.05-.41-2.22C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.22.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.22-.41C8.42 2.21 8.8 2.2 12 2.2zm0 3.3a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm0 10.7a4.2 4.2 0 1 1 0-8.4 4.2 4.2 0 0 1 0 8.4zm6.7-11a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>',
      twitter:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.1 8.1L23.2 22h-6.6l-5.2-6.8L5.4 22H2.3l7.6-8.7L1.6 2h6.8l4.7 6.2L18.9 2zm-1.1 18h1.8L7.3 3.8H5.4L17.8 20z"/></svg>',
      tiktok:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.78.12v-3.1a5.7 5.7 0 0 0-.78-.05 5.69 5.69 0 1 0 5.69 5.69V9.01a7.34 7.34 0 0 0 4.28 1.38V7.3a4.29 4.29 0 0 1-3.23-1.48z"/></svg>',
      youtube:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>',
      linkedin:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>'
    };
    return icons[net]||'';
  }

  function render(s){
    const mapUrl = s.maps_url || MAPS;
    const socials = ['facebook','instagram','twitter','tiktok','youtube','linkedin']
      .filter(k=>s[k] && s[k].trim())
      .map(k=>`<a class="soc-link soc-${k}" href="${s[k]}" target="_blank" rel="noopener" aria-label="${k}">${socialSVG(k)}</a>`)
      .join('');

    // 1) Rewrite any existing address/location text to link to Google Maps
    document.querySelectorAll('[data-location], .location, .address, #location, #address, .footer-address').forEach(el=>{
      el.innerHTML = `<a href="${mapUrl}" target="_blank" rel="noopener" class="map-link">📍 ${s.address}</a>`;
    });

    // 2) Inject a Contact block above the footer (once)
    if(!document.getElementById('site-contact')){
      const block = document.createElement('section');
      block.id = 'site-contact';
      block.className = 'site-contact';
      block.innerHTML = `
        <div class="sc-wrap">
          <h3>Visit / Contact Us</h3>
          <p class="sc-addr">
            <a href="${mapUrl}" target="_blank" rel="noopener" class="map-link">
              <strong>${s.business_name}</strong><br>${s.address}
            </a>
          </p>
          <p class="sc-line">📞 <a href="tel:${(s.phone||'').replace(/\s+/g,'')}">${s.phone}</a></p>
          <p class="sc-line">💬 <a href="https://wa.me/${(s.whatsapp||'').replace(/[^0-9]/g,'')}" target="_blank" rel="noopener">WhatsApp</a></p>
          <p class="sc-line">✉️ <a href="mailto:${s.email}">${s.email}</a></p>
          <p class="sc-line">🕒 ${s.hours}</p>
          ${socials ? `<div class="sc-socials">${socials}</div>` : ''}
        </div>`;
      const footer = document.querySelector('footer') || document.body;
      footer.parentNode.insertBefore(block, footer);
    }

    // 3) Socials also injected into footer
    if(socials && !document.getElementById('footer-socials')){
      const fs = document.createElement('div');
      fs.id='footer-socials';
      fs.className='footer-socials';
      fs.innerHTML = socials;
      const footer = document.querySelector('footer') || document.body;
      footer.appendChild(fs);
    }

    // 4) Make any bare phone/email text clickable
    document.querySelectorAll('a[href^="mailto:"]').forEach(a=>{ if(s.email) a.href='mailto:'+s.email; });
  }

  const cached = sessionStorage.getItem(CACHE_KEY);
  if(cached){ try{ render(JSON.parse(cached)); }catch(e){} }
  fetch('/api/settings').then(r=>r.json()).then(s=>{
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(s));
    render(s);
  }).catch(()=>render({}));
})();
