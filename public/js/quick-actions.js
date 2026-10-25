/* Supreme — Quick Actions sticky-header guard.
   Only acts if the header isn't already sticking. */
(function () {
  'use strict';

  function init() {
    const header = document.querySelector('header.header, header');
    if (!header) return;

    const cs = getComputedStyle(header);
    if (cs.position === 'sticky' || cs.position === 'fixed') return;

    // Walk ancestors looking for overflow that would break sticky
    let el = header.parentElement;
    let broken = false;
    while (el && el !== document.body && el !== document.documentElement) {
      const s = getComputedStyle(el);
      if (s.overflow === 'hidden' || s.overflowY === 'hidden' ||
          s.overflow === 'auto'  || s.overflowY === 'auto'  ||
          s.overflow === 'scroll'|| s.overflowY === 'scroll') {
        broken = true;
        el.style.overflow = 'visible';
        el.style.overflowY = 'visible';
      }
      el = el.parentElement;
    }

    if (broken) {
      header.style.position = 'sticky';
      header.style.top = '0';
      header.style.zIndex = '900';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
