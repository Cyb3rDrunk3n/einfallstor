// Rangliste

import { api, esc, formatNumber, store } from '../lib.js';

export const load = () => api('/leaderboard');

export function mount(root, { entries }) {
  const me = store.me?.name;
  const rows = entries.map((entry, index) => `
    <tr class="${entry.name === me ? 'is-me' : ''}">
      <td><span class="rank rank-${index + 1}">${index + 1}</span></td>
      <td><strong>${esc(entry.name)}</strong>${entry.name === me ? ' <span class="chip chip-ok">du</span>' : ''}</td>
      <td>${esc(entry.level)}</td>
      <td>${entry.items}</td>
      <td class="num">${formatNumber(entry.xp)}</td>
    </tr>`).join('');

  root.innerHTML = `
    <section class="wrap page-head">
      <span class="kicker">Rangliste</span>
      <h1>Wer am meisten gelernt hat</h1>
      <p class="lead">Punkte gibt es für abgeschlossene Lektionen und gelöste Missionen. Insgesamt sind ${formatNumber(store.stats.xp)} Punkte zu holen.</p>
    </section>
    <section class="wrap">
      <div class="board card">
        ${entries.length
          ? `<div class="table-wrap"><table>
               <thead><tr><th>Platz</th><th>Name</th><th>Rang</th><th>Erledigt</th><th class="num">Punkte</th></tr></thead>
               <tbody>${rows}</tbody>
             </table></div>`
          : '<p class="empty">Noch steht niemand auf der Rangliste. Schließe eine Lektion ab, dann gehört der erste Platz dir.</p>'}
      </div>
      ${me ? '' : '<p class="hint">Um auf der Rangliste zu erscheinen, brauchst du ein <a href="#/registrieren">Konto</a>.</p>'}
    </section>`;
}
