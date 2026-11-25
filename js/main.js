(function () {
  var header = document.querySelector('.site-header');
  var body = document.body;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // sticky header
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // mobile menu
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = body.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        body.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // hero video: pause/play control, respects reduced motion
  var vid = document.querySelector('.hero-vid');
  var toggle = document.querySelector('.hero-toggle');
  if (vid) {
    if (reduceMotion) { vid.removeAttribute('autoplay'); vid.pause(); }
    vid.addEventListener('playing', function () {
      if (!toggle) return;
      toggle.hidden = false;
      toggle.classList.remove('paused');
      toggle.setAttribute('aria-label', 'Pause background video');
    });
    vid.addEventListener('pause', function () {
      if (!toggle) return;
      toggle.classList.add('paused');
      toggle.setAttribute('aria-label', 'Play background video');
    });
    if (toggle) {
      toggle.addEventListener('click', function () {
        if (vid.paused) { vid.play(); } else { vid.pause(); }
      });
    }
  }

  // reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // gallery filters (also reachable via gallery.html#weddings etc.)
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var gItems = Array.prototype.slice.call(document.querySelectorAll('.gallery-grid .g-item'));
  var emptyMsg = document.querySelector('.g-empty');
  function applyFilter(key) {
    var shown = 0;
    filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filter') === key ? 'true' : 'false'); });
    gItems.forEach(function (el) {
      var cats = (el.getAttribute('data-cat') || '').split(' ');
      var show = key === 'all' || cats.indexOf(key) !== -1;
      el.hidden = !show;
      if (show) { shown++; el.classList.add('in'); }
    });
    if (emptyMsg) emptyMsg.hidden = shown > 0;
  }
  if (filterBtns.length) {
    filterBtns.forEach(function (b) {
      b.addEventListener('click', function () { applyFilter(b.getAttribute('data-filter')); });
    });
    var hashKey = location.hash.replace('#', '');
    if (hashKey && document.querySelector('[data-filter="' + hashKey + '"]')) applyFilter(hashKey);
  }

  // lightbox for gallery photos (skips filtered-out items)
  var figs = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox] figure'));
  if (figs.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = '<img alt=""><div class="lb-cap"></div>' +
      '<button class="lb-close" aria-label="Close">&times;</button>' +
      '<button class="lb-prev" aria-label="Previous image">&#8249;</button>' +
      '<button class="lb-next" aria-label="Next image">&#8250;</button>';
    document.body.appendChild(lb);
    var img = lb.querySelector('img'), cap = lb.querySelector('.lb-cap'), list = figs, idx = 0, opener = null;
    function visible() { return figs.filter(function (f) { return !f.hidden; }); }
    function show(i) {
      idx = (i + list.length) % list.length;
      var src = list[idx].querySelector('img');
      img.src = src.getAttribute('data-full') || src.currentSrc || src.src;
      img.alt = src.alt;
      var fc = list[idx].querySelector('figcaption');
      cap.textContent = fc ? fc.textContent : '';
      lb.classList.add('open');
    }
    function close() { lb.classList.remove('open'); if (opener) opener.focus(); }
    figs.forEach(function (f) {
      f.tabIndex = 0;
      function open() { list = visible(); opener = f; show(list.indexOf(f)); lb.querySelector('.lb-close').focus(); }
      f.addEventListener('click', open);
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    lb.querySelector('.lb-close').onclick = close;
    lb.querySelector('.lb-prev').onclick = function () { show(idx - 1); };
    lb.querySelector('.lb-next').onclick = function () { show(idx + 1); };
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  // enquiry form: send to Google Apps Script, which emails the enquiry
  var params = new URLSearchParams(location.search);
  var form = document.getElementById('enquiry');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = form.querySelector('.success'), err = form.querySelector('.form-error');
      var btn = form.querySelector('button[type="submit"]');
      ok.classList.remove('show'); err.classList.remove('show');
      var endpoint = form.getAttribute('data-endpoint') || '';
      var reveal = function (el) { el.classList.add('show'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.focus({ preventScroll: true }); };
      if (form.company && form.company.value) { form.reset(); reveal(ok); return; } // spam bot
      if (endpoint.indexOf('https://script.google.com/') !== 0) { reveal(err); return; }
      var label = btn.innerHTML; btn.disabled = true; btn.textContent = 'Sending…';
      var data = new URLSearchParams(new FormData(form));
      data.set('page', location.href);
      fetch(endpoint, { method: 'POST', mode: 'no-cors', body: data })
        .then(function () { form.reset(); reveal(ok); })
        .catch(function () { reveal(err); })
        .then(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  }
  // pre-select hall / event type from links like contact.html?hall=01&event=Wedding
  var hallSel = document.getElementById('hall');
  var hallMap = { '01': 'Premium Hall 01', '02': 'Premium Hall 02', 'either': 'Either Hall' };
  if (hallSel && hallMap[params.get('hall')]) hallSel.value = hallMap[params.get('hall')];
  var evSel = document.getElementById('event-type');
  var ev = params.get('event');
  if (evSel && ev) {
    Array.prototype.forEach.call(evSel.options, function (o) { if (o.value.toLowerCase() === ev.toLowerCase()) evSel.value = o.value; });
  }
  // min date for event date
  var d = document.getElementById('event-date');
  if (d) {
    var t = new Date();
    d.min = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  }

  // year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
