const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const existingReveals = [...document.querySelectorAll('.reveal')];
const motionTargets = [...document.querySelectorAll([
  '.page-banner > div:first-child',
  '.course-entry__heading',
  '.prices-detail .price-card',
  '.prices-detail .price-footer',
  '.facts .fact',
  '.person-info',
  '.studio-copy',
  '.archive > div:last-child'
].join(', '))].filter((element) => !element.classList.contains('reveal'));

if (!reducedMotion && 'IntersectionObserver' in window) {
  existingReveals.forEach((element, index) => {
    if (!element.classList.contains('course-entry')) {
      element.dataset.motionSide = index % 2 ? 'right' : 'left';
    }
  });
  motionTargets.forEach((element, index) => {
    element.classList.add('motion-enter');
    element.dataset.motionSide = index % 2 ? 'right' : 'left';
  });
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('visible', 'is-visible');
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
  [...existingReveals, ...motionTargets].forEach((element) => revealObserver.observe(element));
} else {
  existingReveals.forEach((element) => element.classList.add('visible', 'is-visible'));
}

const menu = document.querySelector('.menu-toggle');
const topbar = document.querySelector('.topbar');
const siteMenu = document.querySelector('.site-menu');
const setMenuOpen = (open) => {
  topbar?.classList.toggle('menu-open', open);
  menu?.setAttribute('aria-expanded', String(open));
  menu?.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri tutte le sezioni');
  siteMenu?.setAttribute('aria-hidden', String(!open));
};
menu?.addEventListener('click', () => setMenuOpen(menu.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuOpen(false);
});
document.addEventListener('click', (event) => {
  if (!topbar?.contains(event.target)) setMenuOpen(false);
});
document.querySelectorAll('.topbar a').forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));

const hero = document.querySelector('.hero-visual');
if (hero && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  hero.addEventListener('pointermove', (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    hero.style.setProperty('--shift-x', `${x * 7}px`);
    hero.style.setProperty('--shift-y', `${y * 7}px`);
  });
  hero.addEventListener('pointerleave', () => {
    hero.style.setProperty('--shift-x', '0px');
    hero.style.setProperty('--shift-y', '0px');
  });
}

function mountWhatsAppButton() {
  if (document.body.dataset.page === 'contact' || document.querySelector('.whatsapp-float')) return;
  const button = document.createElement('a');
  button.className = 'whatsapp-float';
  button.href = 'https://wa.me/393487517656?text=Ciao%20Studio%20Bhumi%2C%20vorrei%20informazioni%20sulle%20pratiche%20e%20sulle%20disponibilit%C3%A0.';
  button.target = '_blank';
  button.rel = 'noopener noreferrer';
  button.setAttribute('aria-label', 'Scrivi a Studio Bhumi su WhatsApp');
  button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41Z"/></svg><span>WhatsApp</span><b aria-hidden="true">↗︎</b>';
  document.body.append(button);
}

mountWhatsAppButton();
