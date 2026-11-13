// Kursübersicht: alle Module mit Lektionen und Fortschritt

import { applyVars, doneLessons, esc, icon, loadCourse, percent, store } from '../lib.js';

export const load = () => loadCourse();

function moduleCard(module, index, done) {
  const finished = module.lessons.filter((lesson) => done.has(lesson.id)).length;
  const minutes = module.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  const xp = module.lessons.reduce((sum, lesson) => sum + lesson.xp, 0);
  return `
    <article class="module card">
      <header class="module-head">
        <div class="ring" data-p="${percent(finished, module.lessons.length)}"><span>${icon(module.icon)}</span></div>
        <div>
          <span class="module-nr">Modul ${index + 1}</span>
          <h2>${esc(module.title)}</h2>
          <p>${esc(module.summary)}</p>
        </div>
        <div class="module-meta">
          <span>${finished} / ${module.lessons.length} Lektionen</span>
          <span>${minutes} Min.</span>
          <span>${xp} XP</span>
        </div>
      </header>
      <ol class="lesson-list">
        ${module.lessons.map((lesson, position) => `
          <li>
            <a class="lesson-row ${done.has(lesson.id) ? 'is-done' : ''}" href="#/kurs/${lesson.id}">
              <span class="lesson-state">${done.has(lesson.id) ? icon('check') : position + 1}</span>
              <span class="lesson-title">${esc(lesson.title)}</span>
              <span class="lesson-meta">${icon('clock')} ${lesson.minutes} Min.</span>
              <span class="lesson-xp">${lesson.xp} XP</span>
              ${icon('arrowRight', 'lesson-go')}
            </a>
          </li>`).join('')}
      </ol>
    </article>`;
}

export function mount(root, modules) {
  const done = doneLessons();
  const lessons = modules.flatMap((module) => module.lessons);
  const finished = lessons.filter((lesson) => done.has(lesson.id)).length;
  const next = lessons.find((lesson) => !done.has(lesson.id));

  root.innerHTML = `
    <section class="wrap page-head">
      <span class="kicker">Der Kurs</span>
      <h1>Pentesting von null</h1>
      <p class="lead">${modules.length} Module, die aufeinander aufbauen. Jede Lektion endet mit einem Quiz. Wer alle Fragen richtig beantwortet, schließt die Lektion ab und bekommt die Punkte.</p>
      <div class="course-bar card">
        <span><b>${finished} von ${lessons.length}</b> Lektionen abgeschlossen</span>
        <div class="bar" data-p="${percent(finished, lessons.length)}"><i></i></div>
        ${next
          ? `<a class="btn btn-primary" href="#/kurs/${next.id}">${finished ? 'Weiterlernen' : 'Erste Lektion starten'} ${icon('arrowRight')}</a>`
          : `<a class="btn btn-primary" href="#/profil">Zur Teilnahmebescheinigung ${icon('arrowRight')}</a>`}
      </div>
      ${store.me ? '' : '<p class="hint">Ohne Konto kannst du alles lesen und jedes Quiz machen. Mit einem <a href="#/registrieren">Konto</a> wird dein Fortschritt gespeichert.</p>'}
    </section>
    <section class="wrap modules">
      ${modules.map((module, index) => moduleCard(module, index, done)).join('')}
    </section>`;
  applyVars(root);
}
