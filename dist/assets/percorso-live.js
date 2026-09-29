// Percorso in tempo reale verso lo studio, dentro la mappa della pagina Parliamone.
// La posizione viene chiesta solo al clic e passata a Google Maps; il sito non la salva.
(() => {
  const card = document.querySelector('[data-live-map]');
  if (!card) return;
  const frame = card.querySelector('[data-map-frame]');
  const mapLink = card.querySelector('[data-map-link]');
  const button = card.querySelector('[data-route-button]');
  const external = card.querySelector('[data-route-external]');
  const status = card.querySelector('[data-route-status]');
  const modes = card.querySelector('[data-route-modes]');
  const badge = card.querySelector('[data-route-badge]');
  const address = card.querySelector('[data-route-address]');
  if (!frame || !button) return;

  const destination = 'Via Lario 17, 20159 Milano';
  const originalSrc = frame.src;
  const originalHref = mapLink?.href;
  const travelModes = { w: 'walking', r: 'transit', d: 'driving' };
  // Aggiorna la mappa solo dopo uno spostamento reale, senza ricaricarla di continuo.
  const minDistance = 60;
  const minInterval = 20000;

  let watchId = null;
  let mode = 'w';
  let origin = null;
  let lastDrawn = null;
  let lastDrawnAt = 0;

  const setStatus = (message) => {
    status.textContent = message;
    status.hidden = !message;
  };

  const metresBetween = (a, b) => {
    const rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad;
    const dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 6371000 * 2 * Math.asin(Math.sqrt(h));
  };

  const clock = () => new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  function draw() {
    if (!origin) return;
    const from = `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}`;
    const params = new URLSearchParams({ saddr: from, daddr: destination, dirflg: mode, output: 'embed', hl: 'it' });
    frame.src = `https://www.google.com/maps?${params}`;
    const directions = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(destination)}&travelmode=${travelModes[mode]}`;
    if (external) external.href = directions;
    if (mapLink) mapLink.href = directions;
    lastDrawn = origin;
    lastDrawnAt = Date.now();
    // Coordinate indicative dello studio: bastano per una distanza arrotondata.
    const distance = metresBetween(origin, { lat: 45.4917, lng: 9.1893 });
    const away = distance >= 1000 ? `circa ${(distance / 1000).toFixed(1).replace('.', ',')} km` : 'meno di 1 km';
    setStatus(`Percorso dalla tua posizione · ${away} in linea d’aria · aggiornato alle ${clock()}`);
  }

  function onPosition({ coords }) {
    const next = { lat: coords.latitude, lng: coords.longitude };
    const first = !origin;
    origin = next;
    if (first) {
      card.classList.add('is-route');
      modes.hidden = false;
      button.textContent = 'Chiudi percorso';
      button.setAttribute('aria-pressed', 'true');
      if (badge) badge.textContent = 'Live';
      if (address) address.textContent = 'percorso · via lario 17';
      draw();
      return;
    }
    if (metresBetween(lastDrawn, next) >= minDistance && Date.now() - lastDrawnAt >= minInterval) draw();
  }

  function onError(error) {
    stop();
    setStatus(error.code === 1
      ? 'Accesso alla posizione non consentito. Puoi abilitarlo nelle impostazioni del browser oppure usare “Indicazioni”.'
      : 'Non è stato possibile trovare la tua posizione. Riprova oppure usa “Indicazioni”.');
  }

  function start() {
    if (!navigator.geolocation || !window.isSecureContext) {
      setStatus('Posizione non disponibile in questo browser: usa “Indicazioni” per aprire Google Maps.');
      return;
    }
    setStatus('Ricerca della tua posizione…');
    button.setAttribute('aria-busy', 'true');
    watchId = navigator.geolocation.watchPosition((position) => {
      button.removeAttribute('aria-busy');
      onPosition(position);
    }, (error) => {
      button.removeAttribute('aria-busy');
      onError(error);
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 });
  }

  function stop() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    origin = null;
    lastDrawn = null;
    card.classList.remove('is-route');
    modes.hidden = true;
    button.textContent = 'Percorso da qui';
    button.setAttribute('aria-pressed', 'false');
    button.removeAttribute('aria-busy');
    if (badge) badge.textContent = 'Isola';
    if (address) address.textContent = 'maps · via lario 17';
    frame.src = originalSrc;
    if (mapLink && originalHref) mapLink.href = originalHref;
    if (external) external.href = 'https://www.google.com/maps/dir/?api=1&destination=Via+Lario+17%2C+20159+Milano';
    setStatus('');
  }

  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => (watchId === null ? start() : stop()));

  modes.addEventListener('click', (event) => {
    const choice = event.target.closest('[data-mode]');
    if (!choice) return;
    mode = choice.dataset.mode;
    modes.querySelectorAll('[data-mode]').forEach((item) => item.setAttribute('aria-pressed', String(item === choice)));
    draw();
  });

  // Il percorso resta attivo solo mentre la pagina è aperta.
  window.addEventListener('pagehide', () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); });
})();
