// Profil: Stand, Abzeichen, Teilnahmebescheinigung, Konto löschen

import { $, api, applyVars, esc, formatNumber, icon, loadCourse, loadMe, percent, setMe, store, toast } from '../lib.js';

export async function load() {
  const [modules] = await Promise.all([loadCourse(), loadMe()]);
  return modules;
}

const date = (seconds) => new Date(seconds * 1000).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

function certificate(me, modules, lessonCount) {
  return `
    <section class="cert">
      <svg class="brand-mark" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
        <path d="M5 28V14a11 11 0 0 1 22 0v14"/><path d="M11.5 28v-9.5a4.5 4.5 0 0 1 9 0V28"/>
      </svg>
      <p class="kicker">Teilnahmebescheinigung</p>
      <h2>Einfallstor · Pentesting von null</h2>
      <p>Hiermit wird bestätigt, dass</p>
      <p class="cert-name">${esc(me.name)}</p>
      <p>alle ${lessonCount} Lektionen des Grundkurses mit bestandenem Quiz abgeschlossen hat. Inhalte: ${modules.map((module) => esc(module.title)).join(', ')}.</p>
      <small>Abgeschlossen am ${date(me.completedAt)}. Dies ist eine Lernbestätigung dieser Plattform und kein anerkanntes Zertifikat.</small>
      <div class="cert-actions"><button class="btn btn-primary" id="print-cert" type="button">${icon('drucker')} Drucken</button></div>
    </section>`;
}

export function mount(root, modules) {
  const me = store.me;
  if (!me) {
    root.innerHTML = `
      <section class="wrap not-found">
        <h1>Dein Profil</h1>
        <p class="lead">Melde dich an, um Punkte, Abzeichen und deinen Fortschritt zu sehen.</p>
        <p class="cert-actions row-actions">
          <a class="btn btn-primary" href="#/anmelden">Anmelden</a>
          <a class="btn btn-ghost" href="#/registrieren">Konto erstellen</a>
        </p>
      </section>`;
    return;
  }

  const done = new Set(me.doneLessons);
  const lessonCount = store.stats.lessons;
  const earned = me.badges.filter((badge) => badge.earned).length;
  const { level } = me;
  const levelProgress = level.next ? percent(me.xp - level.floor, level.next - level.floor) : 100;

  root.innerHTML = `
    <section class="wrap page-head">
      <div class="profile-head card">
        <div class="avatar" aria-hidden="true">${esc(me.name[0].toUpperCase())}</div>
        <div class="profile-main">
          <span class="kicker">Rang ${level.number} · ${esc(level.title)}</span>
          <h1>${esc(me.name)}</h1>
          <div class="level-line">
            <span>${level.next ? `Noch <b>${level.next - me.xp} XP</b> bis zum nächsten Rang` : 'Höchster Rang erreicht'}</span>
            <span>dabei seit ${date(me.since)}</span>
          </div>
          <div class="bar" data-p="${levelProgress}"><i></i></div>
        </div>
        <button class="btn btn-ghost" id="logout" type="button">${icon('logout')} Abmelden</button>
      </div>

      <div class="tiles">
        <div class="tile card"><span>Punkte</span><b>${formatNumber(me.xp)} <small>/ ${formatNumber(store.stats.xp)}</small></b></div>
        <div class="tile card"><span>Lektionen</span><b>${done.size} <small>/ ${lessonCount}</small></b></div>
        <div class="tile card"><span>Missionen</span><b>${me.doneMissions.length} <small>/ ${store.stats.missions}</small></b></div>
        <div class="tile card"><span>Abzeichen</span><b>${earned} <small>/ ${me.badges.length}</small></b></div>
      </div>

      ${me.completedAt ? certificate(me, modules, lessonCount) : ''}

      <section class="panel card">
        <h2>Abzeichen</h2>
        <div class="badges">
          ${me.badges.map((badge) => `
            <div class="badge ${badge.earned ? 'earned' : ''}" title="${badge.earned ? 'Erreicht' : 'Noch offen'}">
              <span class="badge-icon">${icon(badge.icon)}</span>${esc(badge.title)}
            </div>`).join('')}
        </div>
      </section>

      <section class="panel card">
        <h2>Fortschritt nach Modul</h2>
        <div class="progress-list">
          ${modules.map((module) => {
            const finished = module.lessons.filter((lesson) => done.has(lesson.id)).length;
            return `
              <div class="progress-row">
                <span>${esc(module.title)}</span>
                <div class="bar" data-p="${percent(finished, module.lessons.length)}"><i></i></div>
                <span>${finished} / ${module.lessons.length}</span>
              </div>`;
          }).join('')}
        </div>
        ${me.completedAt ? '' : `<p class="cert-actions"><a class="btn btn-primary" href="#/kurs">Weiterlernen ${icon('arrowRight')}</a></p>`}
      </section>

      <section class="panel card danger">
        <h2>Konto löschen</h2>
        <p>Das Konto wird mit allen Punkten und dem gesamten Fortschritt sofort und endgültig entfernt. Zur Bestätigung gib dein Passwort ein.</p>
        <form id="delete-form">
          <input class="input" type="password" name="password" autocomplete="current-password" maxlength="128" placeholder="Passwort" aria-label="Passwort zur Bestätigung" required>
          <button class="btn btn-danger" type="submit">Konto endgültig löschen</button>
        </form>
      </section>
    </section>`;
  applyVars(root);

  $('#logout', root).addEventListener('click', async () => {
    try {
      await api('/logout', {});
      setMe(null);
      toast('Abgemeldet', 'ok');
      location.hash = '#/';
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  $('#delete-form', root).addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = new FormData(event.target).get('password');
    if (!password) return;
    try {
      await api('/account/delete', { password });
      setMe(null);
      toast('Das Konto wurde gelöscht.', 'ok');
      location.hash = '#/';
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  $('#print-cert', root)?.addEventListener('click', () => {
    document.body.classList.add('print-cert');
    window.addEventListener('afterprint', () => document.body.classList.remove('print-cert'), { once: true });
    window.print();
  });
}
