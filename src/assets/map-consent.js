// No Maps request until the visitor loads the map or explicitly requests a route.
(() => {
  window.loadBhumiMap = (frame, source = frame.dataset.src) => {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.hostname !== 'www.google.com' || !url.pathname.startsWith('/maps')) return;
    frame.src = url.href;
    frame.dataset.mapLoaded = 'true';
    frame.removeAttribute('tabindex');
    const overlay = frame.closest('[data-map-host]')?.querySelector('[data-map-consent]');
    if (overlay) overlay.hidden = true;
  };
  document.querySelectorAll('[data-map-host]').forEach(host => {
    const frame = host.querySelector('iframe');
    host.querySelector('[data-load-map]')?.addEventListener('click', () => window.loadBhumiMap(frame));
  });
})();