const navItems = [
  ['index.html', 'Home', 'home'],
  ['discipline.html', 'Discipline', 'discipline'],
  ['insegnanti.html', 'Insegnanti', 'insegnanti'],
  ['orari.html', 'Orari e costi', 'orari'],
  ['eventi.html', 'Eventi', 'eventi'],
  ['dove-siamo.html', 'Dove siamo', 'dove'],
  ['contatti.html', 'Contatti', 'contatti'],
];



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

export function renderSidebar(currentPage) {
  const links = navItems.map(([href, label, key]) => `
    <a class="side-nav__link ${currentPage === key ? 'is-active' : ''}" href="${href}" ${currentPage === key ? 'aria-current="page"' : ''}>
      <span>${label}</span><span class="side-nav__index">${String(navItems.findIndex((item) => item[2] === key) + 1).padStart(2, '0')}</span>
    </a>`).join('');
  return `
    <header class="topbar" aria-label="Navigazione del sito">
      <div class="sidebar__top">
        <a class="brand" href="index.html" aria-label="Studio Bhumi, Home">
          <img class="brand__logo" src="assets/LogoBhumiDef.jpg" width="135" height="120" alt="Studio Bhumi"/>
          <span class="brand__descriptor">studio del movimento</span>
        </a>
        <nav class="topbar__primary" aria-label="Pagine principali">${navItems.slice(1,4).map(([href,label,key]) => `<a href="${href}" ${currentPage === key ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
        <a class="topbar__cta" href="{{logfit}}" target="_blank" rel="noopener noreferrer">Area riservata ${icon('arrow')}</a>
        <button class="sidebar__toggle" type="button" aria-expanded="false" aria-controls="side-menu">
          <span class="sr-only">Apri navigazione</span>${icon('menu')}
        </button>
      </div>
      <div class="topbar__dropdown" id="side-menu" hidden>
        <div class="sidebar__location">{{city}} / {{district}} <span class="location-dot"></span></div>
        <nav class="side-nav" aria-label="Tutte le pagine">${links}<a class="side-nav__link ${currentPage === 'privacy' ? 'is-active' : ''}" href="privacy.html" ${currentPage === 'privacy' ? 'aria-current="page"' : ''}>Privacy e cookie</a></nav>
      </div>
    </header>`;
}

export function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="site-footer__inner">
        <div><a class="brand brand--footer" href="index.html"><img class="brand__logo" src="assets/LogoBhumiDef.jpg" width="135" height="120" alt="Studio Bhumi"/><span class="brand__descriptor">studio del movimento</span></a><p>Movimento consapevole a Milano Isola.</p><nav class="social-links" aria-label="Studio Bhumi sui social"><a href="{{instagram}}" target="_blank" rel="noopener noreferrer">Instagram <span aria-hidden="true">↗︎</span><span class="sr-only"> (si apre in una nuova scheda)</span></a><a href="{{facebook}}" target="_blank" rel="noopener noreferrer">Facebook <span aria-hidden="true">↗︎</span><span class="sr-only"> (si apre in una nuova scheda)</span></a></nav></div>
        <div class="footer-links"><a href="mailto:{{email}}">{{email}}</a><a href="tel:{{phone}}">{{phone_display}}</a><a href="https://www.google.com/maps/search/?api=1&query={{studio_query}}" target="_blank" rel="noopener noreferrer">Studio Bhumi · {{street}}, {{postcode}} {{city}}</a></div>
        <div class="footer-links"><a href="privacy.html">Privacy e cookie</a><a href="{{logfit}}" target="_blank" rel="noopener noreferrer">Area riservata</a></div>
      </div>
      <div class="site-footer__bottom"><span>© Studio Bhumi</span><a class="back-to-top" href="#contenuto">Torna su <span aria-hidden="true">↑︎</span></a><span>Pilates · Gyrotonic® · Yoga · Dainami® · BMC®</span></div>
    </footer>`;
}

