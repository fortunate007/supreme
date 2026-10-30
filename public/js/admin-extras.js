/* Adds Inquiries and Reviews buttons next to Orders on the admin dashboard. */
(function () {
  var done = false;
  function counts(btn, url, label, isNew) {
    fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        var n = Array.isArray(rows) ? rows.filter(isNew).length : 0;
        if (n) btn.textContent = label + ' (' + n + ' new)';
      }).catch(function () {});
  }
  function inject() {
    if (done) return true;
    var ref = null;
    document.querySelectorAll('button, a').forEach(function (e) {
      if ((e.textContent || '').replace(/[^A-Za-z]/g, '').toLowerCase() === 'orders') ref = e;
    });
    if (!ref || !ref.parentNode) return false;
    done = true;
    function mk(label, href) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = (ref.className || '').replace(/\bactive\b/g, '').trim();
      b.textContent = label;
      b.addEventListener('click', function () { location.href = href; });
      ref.parentNode.appendChild(b);
      return b;
    }
    var inq = mk('📥 Inquiries', '/inquiries.html');
    var rev = mk('⭐ Reviews', '/reviews.html');
    counts(inq, '/api/admin/inquiries', '📥 Inquiries', function (x) { return x.status === 'new'; });
    counts(rev, '/api/admin/testimonials', '⭐ Reviews', function (x) { return !x.approved; });
    return true;
  }
  if (inject()) return;
  var mo = new MutationObserver(function () { if (inject()) mo.disconnect(); });
  mo.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(function () { mo.disconnect(); }, 60000);
})();
