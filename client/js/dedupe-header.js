(function () {
  function navBlocks() {
    var set = [];
    document.querySelectorAll('a[href$="cart.html"]').forEach(function (a) {
      var b = a.closest('header') || a.closest('nav');
      if (b && set.indexOf(b) === -1) set.push(b);
    });
    return set;
  }
  function dedupe() {
    navBlocks().slice(1).forEach(function (b) {
      var prev = b.previousElementSibling;
      if (prev && /Quality is Our Name/.test(prev.textContent) && prev.textContent.length < 500) prev.remove();
      b.remove();
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    dedupe();
    var mo = new MutationObserver(dedupe);
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 5000);
  });
})();
