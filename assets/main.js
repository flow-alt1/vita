/* Vita Tech LLC — shared scripts */
(function () {
  // Header shadow on scroll
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile navigation
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('.main-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // Current year in footer
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // ---------- Contact form (Web3Forms) ----------
  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  var thanks = document.getElementById('thank-you');
  var btn = form.querySelector('button[type="submit"]');

  // Math captcha (anti-spam)
  var capInput = document.getElementById('captcha');
  var capQ = document.getElementById('captcha-q');
  var capAnswer = 0;
  function newCaptcha() {
    var a = 2 + Math.floor(Math.random() * 9);
    var b = 1 + Math.floor(Math.random() * 9);
    capAnswer = a + b;
    capQ.textContent = a + ' + ' + b;
    capInput.value = '';
  }
  newCaptcha();
  document.getElementById('captcha-new').addEventListener('click', function () {
    newCaptcha();
    capInput.closest('.field').classList.remove('invalid');
    capInput.focus();
  });

  function validate() {
    var first = null;
    form.querySelectorAll('[required]').forEach(function (el) {
      var field = el.closest('.field');
      var val = el.value.trim();
      var ok = el.hasAttribute('data-captcha') ? parseInt(val, 10) === capAnswer
             : el.type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) : val !== '';
      if (field) field.classList.toggle('invalid', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      if (!ok && !first) first = el;
    });
    return first;
  }

  form.querySelectorAll('input:not([data-captcha]),select,textarea').forEach(function (el) {
    el.addEventListener('input', function () {
      var field = el.closest('.field');
      if (field && field.classList.contains('invalid')) validate();
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.classList.remove('show');
    var bad = validate();
    if (bad) {
      if (bad === capInput && capInput.value.trim() !== '') newCaptcha();
      bad.focus();
      return;
    }

    var data = Object.fromEntries(new FormData(form));
    if (data.botcheck) return; // honeypot filled in: silently drop
    data.subject = 'New inquiry from vitatech.care: ' + (data.service || 'General');

    btn.classList.add('loading');
    btn.disabled = true;

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, json: j }; }); })
      .then(function (res) {
        if (res.ok && res.json.success) {
          var name = (data.name || '').split(' ')[0];
          var nameEl = document.getElementById('thank-name');
          if (nameEl && name) nameEl.textContent = ', ' + name;
          form.style.display = 'none';
          thanks.classList.add('show');
          thanks.setAttribute('tabindex', '-1');
          thanks.focus();
          form.reset();
          newCaptcha();
        } else {
          throw new Error(res.json && res.json.message ? res.json.message : 'Submission failed');
        }
      })
      .catch(function () {
        status.innerHTML = 'Your message could not be sent. Check your connection and try again, or email <a href="mailto:management@vitatech.care">management@vitatech.care</a>.';
        status.classList.add('show');
      })
      .finally(function () {
        btn.classList.remove('loading');
        btn.disabled = false;
      });
  });

  var again = document.getElementById('send-another');
  if (again) again.addEventListener('click', function () {
    thanks.classList.remove('show');
    form.style.display = '';
    form.querySelector('input:not([type=hidden])').focus();
  });
})();
