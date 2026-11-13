// Glossar mit Suche

import { $, api, esc, icon } from '../lib.js';

export const load = () => api('/glossary');

const firstLetter = (term) =>
  term[0].toUpperCase().replace('Ä', 'A').replace('Ö', 'O').replace('Ü', 'U');

function groupsHtml(entries) {
  if (!entries.length) return '<p class="empty">Kein Begriff passt zu dieser Suche.</p>';
  const groups = new Map();
  for (const entry of entries) {
    const letter = firstLetter(entry.term);
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(entry);
  }
  return [...groups].map(([letter, items]) => `
    <div class="letter-group">
      <div class="letter" aria-hidden="true">${letter}</div>
      <div class="term-cards">
        ${items.map((entry) => `<article class="term-card card"><h3>${esc(entry.term)}</h3><p>${esc(entry.text)}</p></article>`).join('')}
      </div>
    </div>`).join('');
}

export function mount(root, { entries }) {
  root.innerHTML = `
    <section class="wrap page-head">
      <span class="kicker">Glossar</span>
      <h1>${entries.length} Fachbegriffe, kurz erklärt</h1>
      <p class="lead">Alle Begriffe aus dem Kurs zum Nachschlagen. Die Suche durchsucht Begriff und Erklärung.</p>
      <label class="search">
        ${icon('search')}
        <input class="input" id="glossary-search" type="search" placeholder="Begriff suchen, zum Beispiel Hash" aria-label="Glossar durchsuchen" autocomplete="off">
      </label>
    </section>
    <section class="wrap glossary" id="glossary-list" aria-live="polite">${groupsHtml(entries)}</section>`;

  $('#glossary-search', root).addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    const hits = entries.filter((entry) => `${entry.term} ${entry.text}`.toLowerCase().includes(query));
    $('#glossary-list', root).innerHTML = groupsHtml(hits);
  });
}
