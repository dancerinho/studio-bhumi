const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  }
}, { threshold: 0.14 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

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
