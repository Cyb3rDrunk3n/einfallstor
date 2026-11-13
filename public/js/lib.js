// Gemeinsame Helfer für alle Ansichten: DOM, API, Zustand, Icons, Meldungen.

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Entschärft Text für die Ausgabe in HTML. Jede veränderliche Angabe läuft hier durch. */
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);

/** Wie esc, zusätzlich wird `Text in Backticks` als Code ausgezeichnet. */
export const inlineCode = (value) => esc(value).replace(/`([^`]+)`/g, '<code>$1</code>');

export const formatNumber = (value) => Number(value).toLocaleString('de-DE');

// --- API -----------------------------------------------------------------------

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** GET ohne body, POST mit body. Wirft ApiError mit der Meldung des Servers. */
export async function api(path, body) {
  const options = { credentials: 'same-origin' };
  if (body !== undefined) {
    options.method = 'POST';
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch {
    throw new ApiError(0, 'Der Server ist nicht erreichbar.');
  }
  let data = null;
  try {
    data = await response.json();
  } catch {
    // Antwort ohne JSON, zum Beispiel bei einem Proxy-Fehler
  }
  if (!response.ok) throw new ApiError(response.status, data?.error || `Fehler ${response.status}`);
  return data;
}

// --- Zustand -------------------------------------------------------------------

export const store = { me: null, stats: null, course: null, pages: [] };

export function setMe(user) {
  store.me = user;
  document.dispatchEvent(new CustomEvent('me'));
}

export async function loadMe() {
  const data = await api('/me');
  store.stats = data.stats;
  store.pages = data.pages || [];
  setMe(data.user);
  return data.user;
}

export async function loadCourse() {
  if (!store.course) store.course = (await api('/course')).modules;
  return store.course;
}

export const doneLessons = () => new Set(store.me?.doneLessons || []);

// --- Icons ---------------------------------------------------------------------

const ICONS = {
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bolt: '<path d="M13 3L5 13.5h6L10 21l9-11.5h-6.5z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  book: '<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5zM5 20.5A2.5 2.5 0 0 0 7.5 21H19"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
  terminal: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M7 9.5l3 2.5-3 2.5M12.5 15H17"/>',
  kompass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  netz: '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M12 7v4M12 11l-5.6 5.4M12 11l5.6 5.4"/>',
  route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 18h6.5a3.25 3.25 0 0 0 0-6.5h-5a3.25 3.25 0 0 1 0-6.5H16"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5s1.3-6.2 3.8-8.5z"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3 8-7.5 9.5-4.5-1.5-7.5-5-7.5-9.5V6z"/><path d="M9 12l2.2 2.2L15 10"/>',
  file: '<path d="M7 3.5h7l4 4v13H7zM14 3.5v4h4M9.5 12.5h5M9.5 16h5"/>',
  flag: '<path d="M6 21V4M6 5h11l-2 3.5 2 3.5H6"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2.5 2.5M13.5 9.5l2 2"/>',
  regler: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  tipp: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  waage: '<path d="M12 4v16M7 20h10M5 8h14M5 8l-2.5 6a2.7 2.7 0 0 0 5 0zM19 8l-2.5 6a2.7 2.7 0 0 0 5 0z"/>',
  logout: '<path d="M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10M15 8l4 4-4 4M19 12H9.5"/>',
  drucker: '<path d="M7 8V4h10v4M7 17H5a1.5 1.5 0 0 1-1.5-1.5v-6A1.5 1.5 0 0 1 5 8h14a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 19 17h-2M7 14h10v6H7z"/>',
  hash: '<path d="M9 4L7 20M17 4l-2 16M4.5 9h16M3.5 15h16"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
  code: '<path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15"/>',
  quiz: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8M12 16.4v.2"/>',
  liste: '<path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20M4.2 6.5h.1M4.2 12h.1M4.2 17.5h.1"/>',
};

export function icon(name, extraClass = '') {
  const body = ICONS[name] || ICONS.info;
  return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

// --- Oberfläche ----------------------------------------------------------------

export function toast(message, kind = 'info') {
  const box = document.createElement('div');
  box.className = `toast toast-${kind}`;
  box.textContent = message;
  $('#toasts').append(box);
  setTimeout(() => box.classList.add('leaving'), 3600);
  setTimeout(() => box.remove(), 4000);
}

/**
 * Überträgt data-p="42" als CSS-Variable --p auf das Element.
 * Der Umweg ist nötig, weil die Content Security Policy style-Attribute im HTML sperrt.
 */
export function applyVars(root) {
  for (const element of $$('[data-p]', root)) element.style.setProperty('--p', element.dataset.p);
}

export const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);
