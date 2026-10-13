
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

function setupMobileMenu() {
  const toggle = document.querySelector('.sidebar__toggle');
  const sidebar = document.querySelector('.topbar');
  const dropdown = document.querySelector('#side-menu');
  if (!toggle || !sidebar || !dropdown) return;
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
  document.addEventListener('focusin', event => {
    if (!sidebar.contains(event.target)) setOpen(false);
  });
  toggle.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault(); setOpen(true); dropdown.querySelector('a')?.focus();
    }
  });
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
  }, { threshold: 0, rootMargin: '0px 0px -16px' });
  items.forEach((item, index) => { item.dataset.motionSide = index % 2 ? 'right' : 'left'; });
  document.documentElement.classList.add('motion-ready');
  items.forEach((item) => observer.observe(item));
}

function setupRouteButton() {
  const button = document.querySelector('[data-route-button]');
  const status = document.querySelector('[data-route-status]');
  const map = document.querySelector('[data-google-map]');
  const externalLink = document.querySelector('[data-map-link]');
  if (!button || !map) return;
  const destination = map.dataset.destination;
  function setStatus(message) {
    if (status) { status.textContent = message; status.hidden = !message; }
  }
  function finish() {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
  button.addEventListener('click', () => {
    if (!navigator.geolocation || !window.isSecureContext) {
      setStatus('Posizione non disponibile in questo browser. Puoi aprire la mappa e inserire il punto di partenza.');
      return;
    }
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    setStatus('Ricerca della posizione…');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const origin = `${coords.latitude},${coords.longitude}`;
      const params = new URLSearchParams({ saddr: origin, daddr: destination, output: 'embed', hl: 'it' });
      window.loadBhumiMap(map, `https://www.google.com/maps?${params}`);
      map.title = 'Percorso dalla tua posizione a Studio Bhumi';
      if (externalLink) externalLink.href = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
      setStatus('');
      finish();
      map.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    }, error => {
      setStatus(error.code === 1
        ? 'Accesso alla posizione non autorizzato. Puoi riprovare o aprire la mappa e inserire il punto di partenza.'
        : 'Non è stato possibile trovare la posizione. Riprova oppure apri la mappa.');
      finish();
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  });
}

setupMobileMenu();
setupReveal();
setupRouteButton();

// Keep the fixed header aligned with content when fonts or orientation change.
const header = document.querySelector('.topbar');
if (header && 'ResizeObserver' in window) {
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
  }).observe(header);
}

// Native fragment navigation stays usable with keyboard and reduced motion.
document.querySelector('.back-to-top')?.addEventListener('click', () => {
  const main = document.querySelector('#contenuto');
  main.setAttribute('tabindex', '-1');
  main.focus({ preventScroll: true });
});

// Mark the visible legal section without changing the URL or scroll position.
const legalLinks = document.querySelectorAll('.legal-index a');
if (legalLinks.length && 'IntersectionObserver' in window) {
  const legalObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting);
    if (!visible.length) return;
    const id = visible[0].target.id;
    legalLinks.forEach(link => {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-15% 0px -40% 0px', threshold: 0 });
  document.querySelectorAll('.legal-section').forEach(section => legalObserver.observe(section));
}
