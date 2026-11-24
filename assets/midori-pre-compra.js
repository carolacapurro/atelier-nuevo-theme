(function () {
  'use strict';

  function init(root) {
    var slides = [].slice.call(root.querySelectorAll('.slide'));
    var thumbs = [].slice.call(root.querySelectorAll('.thumb'));
    var stage = root.querySelector('#stage');
    var bar = root.querySelector('#thumbs');
    var cur = root.querySelector('#cur');
    var tot = root.querySelector('#tot');
    var prev = root.querySelector('.arrow.prev');
    var next = root.querySelector('.arrow.next');
    if (!stage || !slides.length) return;

    var i = 0;
    if (tot) tot.textContent = slides.length;

    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      thumbs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      if (cur) cur.textContent = i + 1;
      var t = thumbs[i];
      if (bar && t && (t.offsetLeft < bar.scrollLeft || t.offsetLeft + t.offsetWidth > bar.scrollLeft + bar.clientWidth)) {
        bar.scrollTo({ left: t.offsetLeft - bar.clientWidth / 2 + t.offsetWidth / 2, behavior: 'smooth' });
      }
    }

    thumbs.forEach(function (t, k) {
      var im = t.querySelector('img');
      var big = slides[k] && slides[k].querySelector('img');
      if (im && big) im.src = big.currentSrc || big.src;
      t.addEventListener('click', function () { go(k); });
    });

    if (prev) prev.addEventListener('click', function () { go(i - 1); });
    if (next) next.addEventListener('click', function () { go(i + 1); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') go(i - 1);
      if (e.key === 'ArrowRight') go(i + 1);
    });

    var x0 = null;
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });

    // Barra fija en mobile: se oculta mientras se ven las opciones de compra
    var sticky = root.querySelector('#sticky');
    var choices = root.querySelector('#choices');
    if (sticky && choices && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        sticky.classList.toggle('hide', entries[0].isIntersecting);
      }, { threshold: 0.35 }).observe(choices);
    }
  }

  function boot() {
    document.querySelectorAll('.mpc').forEach(init);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
