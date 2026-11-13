// Einstieg: Navigation, Routen und Wechsel zwischen den Ansichten.
//
// Jede Ansicht ist ein Objekt mit
//   load(params)              optional, lädt Daten und darf warten
//   mount(root, data, params) baut die Seite auf und gibt bei Bedarf eine Aufräumfunktion zurück
//   title(data)               optional, Seitentitel

import { $, $$, esc, icon, loadMe, store } from './lib.js';
import { startNetwork } from './fx.js';
import * as glossar from './views/glossar.js';
import * as konto from './views/konto.js';
import * as kurs from './views/kurs.js';
import * as landing from './views/landing.js';
import * as lektion from './views/lektion.js';
import * as profil from './views/profil.js';
import * as rangliste from './views/rangliste.js';
import * as seiten from './views/seiten.js';
import * as terminal from './views/terminal.js';
import * as werkzeuge from './views/werkzeuge.js';

const ROUTES = [
  { pattern: /^\/$/, view: landing, nav: 'start', title: '' },
  { pattern: /^\/kurs$/, view: kurs, nav: 'kurs', title: 'Kurs' },
  { pattern: /^\/kurs\/([a-z0-9-]+)\/([a-z0-9-]+)$/, view: lektion, nav: 'kurs', title: 'Lektion' },
  { pattern: /^\/terminal$/, view: terminal, nav: 'terminal', title: 'Übungsterminal' },
  { pattern: /^\/werkzeuge$/, view: werkzeuge, nav: 'werkzeuge', title: 'Werkzeuge' },
  { pattern: /^\/glossar$/, view: glossar, nav: 'glossar', title: 'Glossar' },
  { pattern: /^\/rangliste$/, view: rangliste, nav: 'rangliste', title: 'Rangliste' },
  { pattern: /^\/profil$/, view: profil, nav: 'profil', title: 'Profil' },
  { pattern: /^\/anmelden$/, view: konto.login, nav: 'konto', title: 'Anmelden' },
  { pattern: /^\/registrieren$/, view: konto.register, nav: 'konto', title: 'Konto erstellen' },
  { pattern: /^\/sicherheit$/, view: seiten.sicherheit, nav: 'seite', title: 'Sicherheitskonzept' },
  { pattern: /^\/kodex$/, view: seiten.kodex, nav: 'seite', title: 'Kodex' },
  { pattern: /^\/(impressum|datenschutz)$/, view: seiten.rechtliches, nav: 'seite', title: 'Rechtliches' },
];

// Betreiberseiten: Der Server liefert sie nur, wenn der Betreiber sie hinterlegt hat.
const LEGAL_LINKS = { impressum: 'Impressum', datenschutz: 'Datenschutz' };

const main = $('#inhalt');
const menu = $('#nav-menu');
const toggle = $('#nav-toggle');
let cleanup = null;
let ticket = 0;
let firstRender = true;

function setMenu(open) {
  menu.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
}

function renderUser() {
  const me = store.me;
  $('#nav-user').innerHTML = me
    ? `<a class="chip-user" href="#/profil" title="Zum Profil">${icon('user')}<span>${esc(me.name)}</span><b>${me.xp} XP</b></a>`
    : `<a class="btn btn-ghost btn-sm" href="#/anmelden">Anmelden</a>
       <a class="btn btn-primary btn-sm" href="#/registrieren">Konto erstellen</a>`;
}

function errorPage(message) {
  return `<section class="wrap not-found">
    <h1>Das hat nicht geklappt</h1>
    <p class="lead">${esc(message)}</p>
    <p class="cert-actions"><a class="btn btn-primary" href="#/">Zur Startseite</a></p>
  </section>`;
}

async function navigate() {
  if (location.hash && !location.hash.startsWith('#/')) return; // Sprungmarke wie #inhalt, keine Route
  const path = location.hash.slice(1) || '/';
  const current = ++ticket;

  let route = { view: seiten.notFound, nav: '', title: 'Nicht gefunden' };
  let params = [];
  for (const candidate of ROUTES) {
    const match = candidate.pattern.exec(path);
    if (match) {
      route = candidate;
      params = match.slice(1);
      break;
    }
  }

  setMenu(false);
  document.body.classList.add('is-loading');
  let data;
  let failure = null;
  try {
    if (route.view.load) data = await route.view.load(params);
  } catch (error) {
    failure = error;
  }
  if (current !== ticket) return; // inzwischen wurde woandershin navigiert
  document.body.classList.remove('is-loading');

  if (cleanup) cleanup();
  cleanup = null;
  if (failure?.status === 404) {
    route = { view: seiten.notFound, nav: '', title: 'Nicht gefunden' };
    failure = null;
  }

  document.body.dataset.route = route.nav;
  for (const link of $$('[data-nav]')) {
    if (link.dataset.nav === route.nav) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }

  main.classList.remove('enter');
  let title = route.title;
  if (failure) {
    main.innerHTML = errorPage(failure.message);
  } else {
    cleanup = route.view.mount(main, data, params) || null;
    if (route.view.title) title = route.view.title(data);
  }
  document.title = title ? `${title} · Einfallstor` : 'Einfallstor · Pentesting lernen von null';
  window.scrollTo(0, 0);
  void main.offsetWidth; // erzwingt einen Neustart der Einblend-Animation
  main.classList.add('enter');
  if (!firstRender) main.focus({ preventScroll: true });
  firstRender = false;
}

async function boot() {
  startNetwork($('#netz'));
  document.addEventListener('me', renderUser);
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));

  // Lichtfleck, der auf Karten dem Mauszeiger folgt
  document.addEventListener('pointermove', (event) => {
    const card = event.target.closest?.('.card');
    if (!card) return;
    const box = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - box.left}px`);
    card.style.setProperty('--my', `${event.clientY - box.top}px`);
  });

  try {
    await loadMe();
  } catch (error) {
    renderUser();
    main.innerHTML = errorPage(`${error.message} Läuft der Server noch?`);
    return;
  }
  for (const [name, label] of Object.entries(LEGAL_LINKS)) {
    if (store.pages.includes(name)) $('.footer-links').insertAdjacentHTML('beforeend', `<a href="#/${name}">${label}</a>`);
  }
  window.addEventListener('hashchange', navigate);
  navigate();
}

boot();
