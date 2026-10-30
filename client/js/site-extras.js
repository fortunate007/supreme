(function () {
  'use strict';
  var path = location.pathname.replace(/\/+$/, '') || '/';
  var isHome = path === '/' || /\/index(\.html)?$/.test(path);

  /* 1) Admin button: keep it only inside the side menu */
  var keep = ':not(.menu-item):not(aside a):not(#side-menu a):not([class*="drawer" i] a)';
  var st = document.createElement('style');
  st.textContent = 'a[href*="admin" i]' + keep + ',a.zx-admin' + keep + '{display:none !important}';
  document.head.appendChild(st);
  function dropTopAdmin() {
    [].slice.call(document.querySelectorAll('a')).forEach(function (a) {
      if (a.closest('aside, #side-menu, [class*="drawer" i], .menu-item')) return;
      var t = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (t.length < 24 && /admin\s*$/i.test(t)) a.remove();
    });
  }
  dropTopAdmin();
  if (window.MutationObserver) {
    var obs = new MutationObserver(dropTopAdmin);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); }, 6000);
  }

  /* 2) Reviews */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function stars(n) { n = Math.max(0, Math.min(5, Math.round(Number(n) || 0))); return '\u2605\u2605\u2605\u2605\u2605'.slice(0, n) + '\u2606\u2606\u2606\u2606\u2606'.slice(0, 5 - n); }
  function when(d) { try { return new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return ''; } }
  function css() {
    if (document.getElementById('rv-css')) return;
    var l = document.createElement('link'); l.id = 'rv-css'; l.rel = 'stylesheet'; l.href = '/css/reviews.css?v=1';
    document.head.appendChild(l);
  }
  function card(r) {
    return '<article class="rv-card"><div class="rv-top"><span class="rv-stars" aria-label="' + esc(r.rating) + ' out of 5">' + stars(r.rating) + '</span><span class="rv-date">' + esc(when(r.created_at)) + '</span></div><p class="rv-text">' + esc(r.comment) + '</p><p class="rv-name">\u2014 ' + esc(r.name) + '</p></article>';
  }
  function summary(d) {
    var n = Number(d.count) || 0;
    return n ? '<strong>' + Number(d.average).toFixed(1) + '</strong> / 5 <span class="rv-stars">' + stars(d.average) + '</span> \u00b7 ' + n + (n === 1 ? ' review' : ' reviews') : 'No reviews yet. Be the first to share your experience.';
  }
  function load() { return fetch('/api/reviews').then(function (r) { if (!r.ok) throw new Error('x'); return r.json(); }); }

  function homeStrip(force) {
    if (!isHome || document.getElementById('rv-home')) return;
    var foot = document.querySelector('footer');
    if (!foot && !force) return false;
    css();
    var sec = document.createElement('section');
    sec.id = 'rv-home'; sec.className = 'rv-home';
    sec.innerHTML = '<div class="rv-wrap"><h2>What Our Customers Say</h2><p class="rv-sum"></p><div class="rv-grid"></div><p class="rv-cta"><a class="btn" href="/reviews.html">Write a review</a><a class="rv-link" href="/reviews.html">Read all reviews</a></p></div>';
    if (foot) foot.parentNode.insertBefore(sec, foot); else document.body.appendChild(sec);
    load().then(function (d) {
      sec.querySelector('.rv-sum').innerHTML = summary(d);
      sec.querySelector('.rv-grid').innerHTML = (d.reviews || []).slice(0, 3).map(card).join('');
    }).catch(function () { sec.remove(); });
  }
  if (isHome) {
    var tries = 0;
    (function wait() {
      if (homeStrip(tries > 40) !== false) return;
      tries++; setTimeout(wait, 150);
    })();
  }

  function reviewsPage() {
    var list = document.getElementById('rv-list');
    if (!list) return;
    css();
    var form = document.getElementById('rv-form'), msg = document.getElementById('rv-msg');
    var sum = document.getElementById('rv-summary'), pick = document.getElementById('rv-pick'), rating = 0;
    function say(t, bad) { msg.className = 'rv-msg ' + (bad ? 'err' : 'ok'); msg.textContent = t; }
    function setStars(n) {
      rating = n;
      [].slice.call(pick.children).forEach(function (b, i) { b.className = i < n ? 'on' : ''; b.setAttribute('aria-pressed', i < n ? 'true' : 'false'); });
    }
    for (var i = 1; i <= 5; i++) {
      (function (v) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = '\u2605'; b.setAttribute('aria-label', v + (v === 1 ? ' star' : ' stars'));
        b.onclick = function () { setStars(v); };
        pick.appendChild(b);
      })(i);
    }
    function refresh() {
      load().then(function (d) {
        sum.innerHTML = summary(d);
        list.innerHTML = (d.reviews || []).map(card).join('');
      }).catch(function () { sum.textContent = 'Reviews could not be loaded right now.'; });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!rating) { say('Please choose a star rating.', true); return; }
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
      fetch('/api/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: document.getElementById('rv-name').value, rating: rating, comment: document.getElementById('rv-comment').value, hp: document.getElementById('rv-hp').value })
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; });
      }).then(function (x) {
        if (!x.ok) throw new Error(x.j.error || 'Could not send your review.');
        form.reset(); setStars(0);
        say('Thank you! Your review will appear here once it has been approved.', false);
      }).catch(function (err) { say(err.message || 'Could not send your review.', true); })
        .then(function () { btn.disabled = false; });
    });
    refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reviewsPage); else reviewsPage();
})();
