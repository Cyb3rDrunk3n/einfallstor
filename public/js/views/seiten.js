// Feste Seiten: Sicherheitskonzept, Kodex, Fehlerseite

import { api, esc, icon, isStatic, loadCourse } from '../lib.js';

const MEASURES = [
  {
    icon: 'key',
    title: 'Passwörter mit scrypt und Salt',
    text: 'Gespeichert wird nur ein scrypt-Hash mit eigenem Zufalls-Salt pro Konto. scrypt ist absichtlich rechen- und speicheraufwendig, massenhaftes Raten wird dadurch teuer.',
    code: 'backend/security.py',
    lesson: 'passwoerter/kodieren-hashen-verschluesseln',
  },
  {
    icon: 'lock',
    title: 'Sitzungen ohne Klartext-Token',
    text: 'Das Sitzungstoken besteht aus 256 Bit Zufall. In der Datenbank liegt nur sein SHA-256-Wert. Das Cookie trägt HttpOnly und SameSite=Strict, hinter HTTPS zusätzlich Secure.',
    code: 'backend/security.py',
    lesson: 'web/cross-site-scripting-und-sitzungen',
  },
  {
    icon: 'code',
    title: 'Nur parametrisierte Abfragen',
    text: 'Jede Datenbankabfrage verwendet Platzhalter. Eingaben werden nie in SQL-Text eingebaut, deshalb bleiben sie immer Werte.',
    code: 'backend/api.py',
    lesson: 'web/injection-wenn-daten-zu-befehlen-werden',
  },
  {
    icon: 'shield',
    title: 'Content Security Policy',
    text: 'Der Browser lädt Skripte und Stile nur vom eigenen Server. Eingebettete Skripte und style-Attribute sind gesperrt, fremde Quellen gibt es keine.',
    code: 'server.py',
    lesson: 'web/cross-site-scripting-und-sitzungen',
  },
  {
    icon: 'user',
    title: 'Anmeldung ohne Hinweise',
    text: 'Ein unbekannter Name und ein falsches Passwort ergeben dieselbe Meldung und dieselbe Rechenzeit. Nach zehn Versuchen pro Minute wird die Anmeldung gebremst.',
    code: 'backend/api.py',
    lesson: 'web/zugriffskontrolle-und-anmeldung',
  },
  {
    icon: 'route',
    title: 'Keine Anfragen von fremden Seiten',
    text: 'Schreibende Anfragen müssen JSON sein und vom eigenen Ursprung stammen. Zusammen mit SameSite schützt das vor Cross-Site Request Forgery.',
    code: 'server.py',
    lesson: 'web/cross-site-scripting-und-sitzungen',
  },
  {
    icon: 'quiz',
    title: 'Lösungen bleiben auf dem Server',
    text: 'Quizantworten und Lösungswörter verlassen den Server nie. Der Browser bekommt nur die Fragen und das Ergebnis der Prüfung.',
    code: 'backend/content.py',
    lesson: 'web/wie-webanwendungen-funktionieren',
  },
  {
    icon: 'liste',
    title: 'Eingaben prüfen, Ausgaben kodieren',
    text: 'Der Server prüft Typ, Länge und Format jeder Eingabe. Kursinhalte werden beim Rendern HTML-kodiert, im Browser läuft jede veränderliche Angabe durch eine Escape-Funktion.',
    code: 'backend/content.py · public/js/lib.js',
    lesson: 'web/cross-site-scripting-und-sitzungen',
  },
  {
    icon: 'regler',
    title: 'Datensparsamkeit',
    text: 'Ein Konto besteht aus Benutzername und Passwort-Hash. Es gibt keine E-Mail-Adresse, keine Tracker und keine Anfragen an Dritte. Im Profil lässt sich das Konto vollständig löschen.',
    code: 'backend/db.py',
    lesson: null,
  },
  {
    icon: 'file',
    title: 'Kein Zugriff außerhalb von public',
    text: 'Der Server liefert nur Dateien aus, die er beim Start im Ordner public gefunden hat. Der Pfad einer Anfrage dient nur zum Nachschlagen in dieser Liste und berührt das Dateisystem nie. Alles andere endet mit 404.',
    code: 'server.py',
    lesson: null,
  },
];

const CODEX = [
  'Ich teste nur Systeme, die mir gehören oder für die ich eine schriftliche Erlaubnis habe.',
  'Ich bleibe im vereinbarten Scope.',
  'Ich richte keinen vermeidbaren Schaden an und breche ab, wenn ein System instabil wird.',
  'Ich behandle alles vertraulich, was ich bei einem Test sehe.',
  'Ich melde Funde dem Auftraggeber und nutze sie nicht für eigene Zwecke.',
];

export const sicherheit = {
  load: () => loadCourse(),
  mount(root, modules) {
    const lessons = new Map(modules.flatMap((module) => module.lessons).map((lesson) => [lesson.id, lesson]));
    root.innerHTML = `
      <section class="wrap page-head">
        <span class="kicker">Sicherheitskonzept</span>
        <h1>So ist diese Plattform gebaut</h1>
        <p class="lead">Eine Seite über IT-Sicherheit sollte ihre eigenen Regeln einhalten. Hier steht, welche Maßnahmen umgesetzt sind, wo du sie im Quelltext findest und welche Lektion den Hintergrund erklärt.</p>
        ${isStatic ? '<p class="hint">Du siehst die statische Ausgabe ohne Server. Die Maßnahmen beschreiben die vollständige Plattform, wie sie mit server.py läuft. Hier prüft der Browser das Quiz selbst, die Lösungen stehen deshalb in der Datei daten.json.</p>' : ''}
      </section>
      <section class="wrap measures">
        ${MEASURES.map((measure) => `
          <article class="measure card">
            <div class="measure-top"><div class="feature-icon">${icon(measure.icon)}</div><h2>${measure.title}</h2></div>
            <p>${measure.text}</p>
            <div class="measure-foot">
              <code>${measure.code}</code>
              ${lessons.has(measure.lesson) ? `<a href="#/kurs/${measure.lesson}">Lektion: ${esc(lessons.get(measure.lesson).title)}</a>` : ''}
            </div>
          </article>`).join('')}
      </section>
      <section class="wrap section doc">
        <h2 class="title">Grenzen</h2>
        <p class="lead">Der eingebaute Server ist für den Betrieb auf dem eigenen Rechner gedacht und lauscht deshalb nur auf 127.0.0.1. Wer die Plattform für andere anbietet, stellt einen Reverse Proxy mit HTTPS davor. Die Begrenzung der Anmeldeversuche zählt pro IP-Adresse und lebt im Arbeitsspeicher, nach einem Neustart beginnt sie von vorn.</p>
      </section>`;
  },
};

export const kodex = {
  mount(root) {
    root.innerHTML = `
      <section class="wrap page-head doc">
        <span class="kicker">Kodex</span>
        <h1>Fünf Regeln, ohne Ausnahme</h1>
        <p class="lead">Das Wissen aus diesem Kurs lässt sich zum Schutz und zum Schaden einsetzen. Wer hier lernt, verpflichtet sich auf diese Regeln. Sie gelten für Anfänger genauso wie für Profis.</p>
        <ol class="codex">
          ${CODEX.map((rule, index) => `<li class="card"><b class="codex-nr">${String(index + 1).padStart(2, '0')}</b><span>${rule}</span></li>`).join('')}
        </ol>
        <p class="hint">Die rechtlichen Hintergründe erklärt die Lektion <a href="#/kurs/einstieg/recht-und-ethik-erst-die-erlaubnis">Recht und Ethik</a>. Sie ersetzt keine Rechtsberatung.</p>
        <p class="cert-actions"><a class="btn btn-primary" href="#/kurs">Zum Kurs ${icon('arrowRight')}</a></p>
      </section>`;
  },
};

/** Impressum und Datenschutzerklärung. Den Text hinterlegt der Betreiber, der Server rendert ihn. */
export const rechtliches = {
  load: ([name]) => api(`/pages/${name}`),
  title: (page) => page.title,
  mount(root, page) {
    root.innerHTML = `
      <section class="wrap page-head doc">
        <span class="kicker">Rechtliches</span>
        <h1>${esc(page.title)}</h1>
      </section>
      <section class="wrap doc">
        <div class="prose">${page.html}</div>
      </section>`;
  },
};

export const notFound = {
  mount(root) {
    root.innerHTML = `
      <section class="wrap not-found">
        <b class="grad">404</b>
        <h1>Diese Seite gibt es nicht</h1>
        <p class="lead">Der Statuscode 404 bedeutet: nicht gefunden. Was er sonst noch bedeutet, steht in der Lektion über HTTP.</p>
        <p class="cert-actions"><a class="btn btn-primary" href="#/">Zur Startseite</a></p>
      </section>`;
  },
};
