// Startseite

import { $, $$, doneLessons, esc, icon, loadCourse, store } from '../lib.js';
import { countUp, observeReveal, typeLines } from '../fx.js';

const FEATURES = [
  ['book', 'Lesen', 'Kurze Lektionen, die bei null anfangen. Jeder Fachbegriff wird erklärt, wenn er zum ersten Mal vorkommt.'],
  ['quiz', 'Prüfen', 'Zu jeder Lektion gehört ein Quiz. Ausgewertet wird auf dem Server, Punkte gibt es erst, wenn alles stimmt.'],
  ['terminal', 'Ausprobieren', 'Das Übungsterminal simuliert eine Linux-Shell. Missionen üben das Handwerk, kaputt gehen kann nichts.'],
  ['trophy', 'Dranbleiben', 'Punkte, Ränge und Abzeichen zeigen deinen Stand. Am Ende wartet eine Teilnahmebescheinigung.'],
];

const RULES = [
  ['waage', 'Nur mit Erlaubnis', 'Getestet wird, was dir gehört oder wofür du eine schriftliche Freigabe hast.'],
  ['route', 'Im Scope bleiben', 'Was nicht vereinbart ist, wird nicht angefasst.'],
  ['file', 'Melden statt ausnutzen', 'Funde gehören in den Bericht an den Auftraggeber.'],
];

const HEADERS = [
  ['Content-Security-Policy', "default-src 'self'; script-src 'self'"],
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'DENY'],
  ['Referrer-Policy', 'no-referrer'],
  ['Set-Cookie', 'sid=…; HttpOnly; SameSite=Strict'],
];

export const load = () => loadCourse();

export function mount(root, modules) {
  const stats = store.stats;
  const lessons = modules.flatMap((module) => module.lessons);
  const done = doneLessons();
  const next = lessons.find((lesson) => !done.has(lesson.id)) || lessons[0];
  const hours = String(Math.round(stats.minutes / 6) / 10).replace('.', ',');

  root.innerHTML = `
    <section class="wrap hero">
      <div class="hero-copy">
        <span class="eyebrow"><i></i>Open Source · kostenlos · ohne Tracking</span>
        <h1>Finde die Lücke, <span class="grad">bevor es ein anderer tut.</span></h1>
        <p class="lead">Einfallstor bringt dir Pentesting von Grund auf bei: Recht, Netzwerke, Linux, Web-Sicherheit und Methodik. Mit Quiz zu jeder Lektion und einem Übungsterminal direkt im Browser.</p>
        <div class="hero-actions">
          <a class="btn btn-primary btn-lg" href="#/kurs">${done.size ? 'Weiterlernen' : 'Kurs starten'} ${icon('arrowRight')}</a>
          <a class="btn btn-ghost btn-lg" href="#/terminal">${icon('terminal')} Terminal öffnen</a>
        </div>
        <ul class="hero-points">
          <li>${icon('check')} Keine Vorkenntnisse nötig</li>
          <li>${icon('check')} Konto ohne E-Mail-Adresse</li>
          <li>${icon('check')} Läuft auf deinem eigenen Rechner</li>
        </ul>
      </div>
      <div class="hero-visual">
        <div class="term">
          <div class="term-bar">
            <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
            <span class="term-title">neuling@einfallstor: ~</span>
          </div>
          <div class="hero-term-body" id="hero-term" aria-hidden="true"></div>
        </div>
        <span class="float-tag tag-a">22/tcp · ssh</span>
        <span class="float-tag tag-b">200 OK</span>
        <span class="float-tag tag-c">rw-r--r--</span>
      </div>
    </section>

    <section class="wrap reveal">
      <div class="stats">
        <div class="stat"><b data-count="${stats.modules}">0</b><span>Module</span></div>
        <div class="stat"><b data-count="${stats.lessons}">0</b><span>Lektionen</span></div>
        <div class="stat"><b data-count="${stats.questions}">0</b><span>Quizfragen</span></div>
        <div class="stat"><b data-count="${stats.missions}">0</b><span>Terminal-Missionen</span></div>
      </div>
    </section>

    <section class="wrap section">
      <div class="section-head reveal">
        <span class="kicker">So lernst du hier</span>
        <h2 class="title">Verstehen, prüfen, ausprobieren</h2>
        <p class="lead">Der Kurs setzt nichts voraus außer Neugier. Er erklärt, wie Systeme funktionieren, wo sie brechen und wie man sie absichert.</p>
      </div>
      <div class="features">
        ${FEATURES.map(([symbol, title, text], index) => `
          <article class="feature card reveal" data-delay="${index}">
            <div class="feature-icon">${icon(symbol)}</div>
            <h3>${title}</h3>
            <p>${text}</p>
          </article>`).join('')}
      </div>
    </section>

    <section class="wrap section">
      <div class="section-head reveal">
        <span class="kicker">Der Lernpfad</span>
        <h2 class="title">${stats.modules} Module, die aufeinander aufbauen</h2>
        <p class="lead">Vom ersten Fachbegriff bis zum fertigen Bericht. Rechne mit etwa ${hours} Stunden Lesezeit, dazu kommen Quiz und Missionen.</p>
      </div>
      <div class="path">
        ${modules.map((module, index) => `
          <a class="path-item card reveal" data-delay="${index % 4}" href="#/kurs/${module.lessons[0].id}">
            <div class="path-top">${icon(module.icon)}<span class="path-nr">${String(index + 1).padStart(2, '0')}</span></div>
            <h3>${esc(module.title)}</h3>
            <p>${esc(module.summary)}</p>
            <span class="path-meta">${module.lessons.length} Lektionen · ${module.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)} Min.</span>
          </a>`).join('')}
      </div>
    </section>

    <section class="wrap section split">
      <div class="reveal">
        <span class="kicker">Kodex</span>
        <h2 class="title">Erst die Erlaubnis, dann der Test</h2>
        <p class="lead">Wer ohne Erlaubnis in fremde Systeme eindringt, macht sich strafbar. Deshalb beginnt der Kurs mit Recht und Ethik. Alle Übungen laufen in einer Simulation oder in deinem eigenen Labor.</p>
        <p class="cert-actions"><a class="btn btn-ghost" href="#/kodex">Zum Kodex ${icon('arrowRight')}</a></p>
      </div>
      <div class="rules">
        ${RULES.map(([symbol, title, text], index) => `
          <article class="rule card reveal" data-delay="${index}">
            <div class="rule-icon">${icon(symbol)}</div>
            <div><h3>${title}</h3><p>${text}</p></div>
          </article>`).join('')}
      </div>
    </section>

    <section class="wrap section split">
      <div class="term reveal">
        <div class="term-bar">
          <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
          <span class="term-title">Antwort dieses Servers</span>
        </div>
        <div class="http-body">
          <div><span class="c-ok">HTTP/1.0 200 OK</span></div>
          ${HEADERS.map(([name, value]) => `<div><span class="c-key">${name}:</span> ${esc(value)}</div>`).join('')}
        </div>
      </div>
      <div class="reveal">
        <span class="kicker">Unter der Haube</span>
        <h2 class="title">Die Plattform ist selbst ein Lehrstück</h2>
        <p class="lead">Was der Kurs über sichere Webanwendungen erklärt, setzt diese Seite um. Du kannst es im Quelltext nachlesen und mit den Entwicklerwerkzeugen deines Browsers nachprüfen.</p>
        <ul class="ticks">
          <li>${icon('check')} Backend in Python, nur Standardbibliothek</li>
          <li>${icon('check')} Passwörter mit scrypt und Salt gespeichert</li>
          <li>${icon('check')} Sitzungs-Cookie mit HttpOnly und SameSite</li>
          <li>${icon('check')} Content Security Policy ohne Ausnahmen</li>
        </ul>
        <a class="btn btn-ghost" href="#/sicherheit">Sicherheitskonzept ansehen ${icon('arrowRight')}</a>
      </div>
    </section>

    <section class="wrap">
      <div class="cta reveal">
        <h2>${done.size ? 'Weiter geht es mit der nächsten Lektion' : 'Bereit für die erste Lektion?'}</h2>
        <p>${done.size ? esc(next.title) : `${next.minutes} Minuten lesen, ein Quiz lösen, die ersten ${next.xp} Punkte holen.`}</p>
        <a class="btn btn-primary btn-lg" href="#/kurs/${next.id}">${done.size ? 'Weiterlernen' : 'Jetzt anfangen'} ${icon('arrowRight')}</a>
      </div>
    </section>`;

  const stopTyping = typeLines($('#hero-term', root), [
    { type: 'cmd', text: 'einfallstor --start' },
    { type: 'ok', text: `Kurs geladen: ${stats.modules} Module, ${stats.lessons} Lektionen` },
    { type: 'ok', text: `Quiz bereit: ${stats.questions} Fragen` },
    { type: 'ok', text: `Übungsterminal bereit: ${stats.missions} Missionen` },
    { type: 'cmd', text: 'cat kodex.txt' },
    { type: 'out', text: 'Regel 1: Erst die Erlaubnis, dann der Test.' },
    { type: 'cmd', text: 'whoami' },
    { type: 'out', text: store.me ? store.me.level.title.toLowerCase() : 'neuling' },
  ]);
  const stopReveal = observeReveal(root);
  const stopCounters = $$('[data-count]', root).map(countUp);

  return () => {
    stopTyping();
    stopReveal();
    stopCounters.forEach((stop) => stop());
  };
}
