const navItems = [
  ['index.html', 'Home', 'home'],
  ['discipline.html', 'Discipline', 'discipline'],
  ['insegnanti.html', 'Insegnanti', 'insegnanti'],
  ['orari.html', 'Orari e costi', 'orari'],
  ['eventi.html', 'Eventi', 'eventi'],
  ['dove-siamo.html', 'Dove siamo', 'dove'],
  ['contatti.html', 'Contatti', 'contatti'],
];

const currentPage = document.body.dataset.page || 'home';

function icon(name) {
  const icons = {
    arrow: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 19 19 5M9 5h10v10"/></svg>',
    menu: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M4 17h16"/></svg>',
    close: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    pin: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    map: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/></svg>',
    phone: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 3h3l2 5-2 2c1 3 3 5 6 6l2-2 5 2v3c0 1-1 2-2 2C11 21 3 13 3 5c0-1 1-2 2-2z"/></svg>',
    mail: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 5h18v14H3zM3 6l9 7 9-7"/></svg>',
  };
  return icons[name] || '';
}

function renderSidebar() {
  const mount = document.querySelector('#sidebar-mount');
  if (!mount) return;
  const links = navItems.map(([href, label, key]) => `
    <a class="side-nav__link ${currentPage === key ? 'is-active' : ''}" href="${href}" ${currentPage === key ? 'aria-current="page"' : ''}>
      <span>${label}</span><span class="side-nav__index">${String(navItems.findIndex((item) => item[2] === key) + 1).padStart(2, '0')}</span>
    </a>`).join('');
  mount.innerHTML = `
    <header class="topbar" aria-label="Navigazione del sito">
      <div class="sidebar__top">
        <a class="brand" href="index.html" aria-label="Studio Bhumi, Home">
          <img class="brand__logo" src="assets/LogoBhumiDef.jpg" width="135" height="120" alt="Studio Bhumi"/>
          <span class="brand__descriptor">studio del movimento</span>
        </a>
        <nav class="topbar__primary" aria-label="Pagine principali">${navItems.slice(1,4).map(([href,label,key]) => `<a href="${href}" ${currentPage === key ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
        <a class="topbar__cta" href="mailto:studiobhumi@gmail.com?subject=Richiesta%20lezione%20di%20prova">Prenota una prova ${icon('arrow')}</a>
        <button class="sidebar__toggle" type="button" aria-expanded="false" aria-controls="side-menu">
          <span class="sr-only">Apri navigazione</span>${icon('menu')}
        </button>
      </div>
      <div class="topbar__dropdown" id="side-menu" hidden>
        <div class="sidebar__location">Milano / Isola <span class="location-dot"></span></div>
        <nav class="side-nav" aria-label="Tutte le pagine">${links}<a class="side-nav__link" href="privacy.html">Privacy</a><a class="side-nav__link" href="cookie.html">Cookie</a></nav>
      </div>
    </header>`;
}

function renderFooter() {
  const mount = document.querySelector('#footer-mount');
  if (!mount) return;
  mount.innerHTML = `
    <footer class="site-footer">
      <div class="site-footer__inner">
        <div><a class="brand brand--footer" href="index.html"><img class="brand__logo" src="assets/LogoBhumiDef.jpg" width="135" height="120" alt="Studio Bhumi"/><span class="brand__descriptor">studio del movimento</span></a><p>Movimento consapevole a Milano Isola.</p></div>
        <div class="footer-links"><a href="mailto:studiobhumi@gmail.com">studiobhumi@gmail.com</a><a href="tel:+393487517656">348 751 7656</a><a href="dove-siamo.html">Via Lario 17, Milano</a></div>
        <div class="footer-links"><a href="privacy.html">Privacy policy</a><a href="cookie.html">Cookie policy</a><a href="https://logfit.it/registration?codeweb=studio_bhumi_mi" target="_blank" rel="noopener">Area riservata</a></div>
      </div>
      <div class="site-footer__bottom"><span>© Studio Bhumi</span><span>Pilates · Gyrotonic® · Yoga · Dainami® · BMC®</span></div>
    </footer>`;
}

function setupMobileMenu() {
  const toggle = document.querySelector('.sidebar__toggle');
  const sidebar = document.querySelector('.topbar');
  const dropdown = document.querySelector('#side-menu');
  if (!toggle || !sidebar) return;
  function setOpen(open) {
    sidebar.classList.toggle('is-open', open);
    dropdown.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.innerHTML = `<span class="sr-only">${open ? 'Chiudi' : 'Apri'} navigazione</span>${icon(open ? 'close' : 'menu')}`;
  }
  toggle.addEventListener('click', event => { event.stopPropagation(); setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
  sidebar.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    setOpen(false);
  }));
  document.addEventListener('click', event => { if (!sidebar.contains(event.target)) setOpen(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !dropdown.hidden) { setOpen(false); toggle.focus(); } });
}

function setupReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -28px' });
  document.documentElement.classList.add('motion-ready');
  items.forEach((item) => observer.observe(item));
}

function setupRouteButton() {
  const button = document.querySelector('[data-route-button]');
  const status = document.querySelector('[data-route-status]');
  if (!button) return;
  button.insertAdjacentHTML('afterend', '<p class="map-note">Con il tuo consenso, la posizione viene condivisa con Google Maps per calcolare il percorso. Non viene salvata dal sito.</p>');
  const destination = 'Via Lario 17, 20159 Milano';
  const fallback = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
  button.addEventListener('click', () => {
    if (!navigator.geolocation) {
      window.location.assign(fallback);
      return;
    }
    button.setAttribute('aria-busy', 'true');
    if (status) status.textContent = 'Richiesta posizione in corso…';
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      const route = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${encodeURIComponent(destination)}`;
      if (status) status.textContent = 'Posizione ricevuta. Apertura del percorso…';
      window.location.assign(route);
      button.removeAttribute('aria-busy');
    }, () => {
      if (status) status.textContent = 'Posizione non disponibile: puoi aprire comunque la mappa della sede.';
      button.removeAttribute('aria-busy');
      window.location.assign(fallback);
    }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
  });
}

document.querySelectorAll('.map-panel').forEach(panel => { panel.innerHTML = '<a class="map-access" href="https://www.google.com/maps/search/?api=1&query=Via+Lario+17,+20159+Milano" target="_blank" rel="noopener">' + icon('map') + '<strong>Studio Bhumi</strong><span>Via Lario 17 · Milano Isola</span><span>Apri la mappa ↗</span></a>'; });
renderSidebar();
renderFooter();
setupMobileMenu();
setupReveal();
setupRouteButton();

document.addEventListener('keydown', event => { if(event.key === 'Escape') {document.querySelector('.sidebar')?.classList.remove('is-open');document.querySelector('.sidebar__toggle')?.setAttribute('aria-expanded','false');} });
