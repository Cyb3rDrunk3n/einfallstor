// Übungsterminal: Bildschirm, Eingabe und Missionen

import { $, $$, api, esc, icon, inlineCode, loadMe, percent, store, toast } from '../lib.js';
import { Shell } from '../shell.js';

const STARTERS = ['help', 'pwd', 'ls -la', 'cat willkommen.txt', 'man grep'];

export const load = () => api('/terminal');

function missionHtml(mission, index) {
  return `
    <div class="mission" data-id="${esc(mission.id)}">
      <button class="mission-head" type="button" aria-expanded="false">
        <span class="mission-nr">${index + 1}</span>
        <span>${esc(mission.title)}</span>
        <span class="mission-xp">${esc(mission.xp)} XP</span>
      </button>
      <div class="mission-body">
        <p>${inlineCode(mission.task)}</p>
        <div class="mission-hints"></div>
        <form class="mission-form">
          <input class="input input-mono" name="answer" placeholder="Lösungswort" aria-label="Lösungswort für die Mission ${esc(mission.title)}" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="200">
          <button class="btn btn-primary btn-sm" type="submit">Prüfen</button>
        </form>
        <p class="mission-ok" hidden>${icon('check')} Gelöst</p>
        <div class="mission-links">
          <button class="link-btn" type="button" data-hint>Tipp anzeigen</button>
          ${mission.lesson ? `<a href="#/kurs/${esc(mission.lesson)}">Passende Lektion</a>` : ''}
        </div>
      </div>
    </div>`;
}

export function mount(root, data) {
  const shell = new Shell(data);
  const solved = new Set(store.me?.doneMissions || []);
  const hintsShown = new Map();

  root.innerHTML = `
    <section class="wrap page-head">
      <span class="kicker">Übungsterminal</span>
      <h1>Linux üben, ohne etwas kaputt zu machen</h1>
      <p class="lead">Eine simulierte Shell in deinem Browser. Dahinter steckt kein echtes System und kein Netzwerk. Die Missionen führen von den ersten Befehlen bis zur Auswertung eines Protokolls.</p>
    </section>

    <section class="wrap term-layout">
      <div>
        <div class="term term-live">
          <div class="term-bar">
            <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
            <span class="term-title" id="term-title"></span>
            <button class="btn btn-ghost btn-sm" id="term-reset" type="button">Zurücksetzen</button>
          </div>
          <div class="term-screen" id="term-screen">
            <div class="term-out" id="term-out" role="log" aria-live="polite"></div>
            <div class="term-line">
              <label class="term-prompt" id="term-prompt" for="term-input"></label>
              <input class="term-input" id="term-input" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" aria-label="Befehl eingeben">
            </div>
          </div>
        </div>
        <div class="term-keys">
          <span>Zum Einstieg:</span>
          ${STARTERS.map((command) => `<button type="button" data-run="${esc(command)}">${esc(command)}</button>`).join('')}
        </div>
      </div>

      <aside class="missions card" id="missions" aria-label="Missionen">
        <div class="missions-head">
          <h2>Missionen</h2>
          <span class="chip" id="missions-count"></span>
        </div>
        <div class="bar" id="missions-bar"><i></i></div>
        ${data.missions.map(missionHtml).join('')}
        <p class="hint">${store.me
          ? 'Jede gelöste Mission bringt Punkte für dein Profil.'
          : 'Ohne <a href="#/registrieren">Konto</a> bleibt eine gelöste Mission nur bis zum Neuladen der Seite abgehakt.'}</p>
      </aside>
    </section>`;

  // --- Terminal ---
  const screen = $('#term-screen', root);
  const output = $('#term-out', root);
  const input = $('#term-input', root);
  let historyIndex = 0;

  function promptNodes() {
    const user = document.createElement('span');
    user.className = 'p-user';
    user.textContent = `${shell.user}@${shell.host}`;
    const path = document.createElement('span');
    path.className = 'p-path';
    path.textContent = shell.promptPath;
    return [user, ':', path, '$'];
  }

  function refreshPrompt() {
    $('#term-prompt', root).replaceChildren(...promptNodes());
    $('#term-title', root).textContent = `${shell.user}@${shell.host}: ${shell.promptPath}`;
  }

  function print(segments) {
    const row = document.createElement('div');
    for (const [text, style] of segments) {
      const span = document.createElement('span');
      if (style) span.className = style;
      span.textContent = text; // textContent: Ausgaben werden nie als HTML gelesen
      row.append(span);
    }
    output.append(row);
  }

  function echo(text) {
    const row = document.createElement('div');
    row.append(...promptNodes(), ` ${text}`);
    output.append(row);
  }

  function greet() {
    print([['Übungsbox bereit. Tippe help und drücke Enter.', 't-info']]);
    print([['Simulation: kein echtes System, kein Netzwerk.', 't-dim']]);
  }

  function execute(command) {
    echo(command);
    const result = shell.run(command);
    if (result.clear) output.replaceChildren();
    result.lines.forEach(print);
    input.value = '';
    historyIndex = shell.history.length;
    refreshPrompt();
    screen.scrollTop = screen.scrollHeight;
  }

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      execute(input.value);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      historyIndex = Math.max(0, Math.min(shell.history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
      input.value = shell.history[historyIndex] || '';
    } else if (event.key === 'Tab' && input.value) {
      // Bei leerer Eingabe bleibt Tab frei, damit man das Feld mit der Tastatur verlassen kann.
      event.preventDefault();
      const { line, options } = shell.complete(input.value);
      input.value = line;
      if (options.length) {
        echo(line);
        print([[options.join('  '), 't-dim']]);
        screen.scrollTop = screen.scrollHeight;
      }
    } else if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      output.replaceChildren();
    } else if (event.ctrlKey && event.key.toLowerCase() === 'c' && !String(window.getSelection())) {
      event.preventDefault();
      echo(`${input.value}^C`);
      input.value = '';
    }
  });

  screen.addEventListener('click', () => {
    if (!String(window.getSelection())) input.focus({ preventScroll: true });
  });

  $('#term-reset', root).addEventListener('click', () => {
    shell.reset();
    output.replaceChildren();
    greet();
    refreshPrompt();
    input.focus({ preventScroll: true });
  });

  $('.term-keys', root).addEventListener('click', (event) => {
    const button = event.target.closest('[data-run]');
    if (!button) return;
    execute(button.dataset.run);
    input.focus({ preventScroll: true });
  });

  greet();
  refreshPrompt();

  // --- Missionen ---
  const panel = $('#missions', root);

  function setOpen(id) {
    for (const box of $$('.mission', panel)) {
      const open = box.dataset.id === id;
      box.classList.toggle('is-open', open);
      $('.mission-head', box).setAttribute('aria-expanded', String(open));
    }
  }

  function refresh() {
    data.missions.forEach((mission, index) => {
      const box = $(`.mission[data-id="${CSS.escape(mission.id)}"]`, panel);
      const isDone = solved.has(mission.id);
      box.classList.toggle('is-done', isDone);
      $('.mission-nr', box).innerHTML = isDone ? icon('check') : String(index + 1);
      $('.mission-form', box).hidden = isDone;
      $('.mission-ok', box).hidden = !isDone;
    });
    $('#missions-count', root).textContent = `${solved.size} / ${data.missions.length}`;
    $('#missions-bar', root).style.setProperty('--p', percent(solved.size, data.missions.length));
  }

  const firstOpen = () => data.missions.find((mission) => !solved.has(mission.id))?.id ?? null;

  panel.addEventListener('click', (event) => {
    const head = event.target.closest('.mission-head');
    if (head) {
      const box = head.closest('.mission');
      setOpen(box.classList.contains('is-open') ? null : box.dataset.id);
      return;
    }
    const hintButton = event.target.closest('[data-hint]');
    if (!hintButton) return;
    const box = hintButton.closest('.mission');
    const mission = data.missions.find((entry) => entry.id === box.dataset.id);
    const count = hintsShown.get(mission.id) || 0;
    const hint = document.createElement('p');
    hint.innerHTML = inlineCode(mission.hints[count]);
    $('.mission-hints', box).append(hint);
    hintsShown.set(mission.id, count + 1);
    if (count + 1 >= mission.hints.length) hintButton.hidden = true;
    else hintButton.textContent = 'Noch ein Tipp';
  });

  panel.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const id = form.closest('.mission').dataset.id;
    const answer = String(new FormData(form).get('answer')).trim();
    if (!answer) return;
    const button = $('button', form);
    button.disabled = true;
    try {
      const result = await api(`/missions/${id}`, { answer });
      if (!result.correct) {
        toast('Das ist noch nicht das Lösungswort.', 'warn');
        return;
      }
      solved.add(id);
      if (result.saved) await loadMe();
      toast(result.xpAwarded ? `Mission gelöst: +${result.xpAwarded} XP` : 'Mission gelöst', 'ok');
      refresh();
      setOpen(firstOpen());
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      button.disabled = false;
    }
  });

  refresh();
  setOpen(firstOpen());
}
