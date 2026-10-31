/* Adds Inquiries and Reviews buttons next to Orders on the admin dashboard. */
(function () {
  var done = false;
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
      b.textContent = label; b.dataset.href = href || '';
      b.addEventListener('click', function () { if (b.dataset.href) location.href = b.dataset.href; });
      ref.parentNode.appendChild(b);
      return b;
    }
    var inq = mk('📥 Inquiries', '/inquiries.html');
    var rev = mk('⭐ Reviews', '');
    fetch('/api/admin/paths', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (j) { rev.dataset.href = String(j.base || '').replace(/\/+$/, '') + '/reviews'; })
      .catch(function () { rev.style.display = 'none'; });
    fetch('/api/admin/inquiries', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        var n = Array.isArray(rows) ? rows.filter(function (x) { return x.status === 'new'; }).length : 0;
        if (n) inq.textContent = '📥 Inquiries (' + n + ' new)';
      }).catch(function () {});
    return true;
  }
  if (inject()) return;
  var mo = new MutationObserver(function () { if (inject()) mo.disconnect(); });
  mo.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(function () { mo.disconnect(); }, 60000);
})();
