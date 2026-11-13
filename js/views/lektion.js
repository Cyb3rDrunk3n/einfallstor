// Lektion: Text, Inhaltsverzeichnis, Quiz

import { $, $$, api, doneLessons, esc, icon, inlineCode, loadCourse, loadMe, store, toast } from '../lib.js';
import { burst } from '../fx.js';

export async function load([moduleId, slug]) {
  const [lesson, modules] = await Promise.all([api(`/lessons/${moduleId}/${slug}`), loadCourse()]);
  return { lesson, module: modules.find((module) => module.id === moduleId) };
}

export const title = ({ lesson }) => lesson.title;

/** Zufällige Reihenfolge der Antworten, damit sich keine Position einprägt. */
function shuffled(count) {
  const order = Array.from({ length: count }, (_, index) => index);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function sideList(module, lesson, done) {
  return module.lessons.map((item) => `
    <li>
      <a href="#/kurs/${item.id}" class="${done.has(item.id) ? 'is-done' : ''}" ${item.id === lesson.id ? 'aria-current="page"' : ''}>
        <span class="side-dot">${done.has(item.id) ? icon('check') : ''}</span>${esc(item.title)}
      </a>
    </li>`).join('');
}

function quizHtml(lesson) {
  return lesson.quiz.map((question, index) => `
    <fieldset class="q" data-q="${index}">
      <legend><span class="q-nr">${String(index + 1).padStart(2, '0')}</span><span>${inlineCode(question.question)}</span></legend>
      ${shuffled(question.options.length).map((option) => `
        <label class="opt">
          <input type="radio" name="q${index}" value="${option}">
          <span>${inlineCode(question.options[option])}</span>
        </label>`).join('')}
      <div class="q-note"><span class="q-icon"></span><span class="q-text"></span></div>
    </fieldset>`).join('');
}

export function mount(root, { lesson, module }) {
  const done = doneLessons();

  root.innerHTML = `
    <div class="read-bar" id="read-bar"><i></i></div>
    <div class="wrap lesson-layout">
      <aside class="lesson-side">
        <nav class="side-block card" aria-label="Lektionen in diesem Modul">
          <p class="side-title">${esc(module.title)}</p>
          <ul class="side-list" id="side-list">${sideList(module, lesson, done)}</ul>
        </nav>
        <nav class="side-block card toc-block" aria-label="Abschnitte dieser Lektion">
          <p class="side-title">In dieser Lektion</p>
          <ul class="side-list toc" id="toc"></ul>
        </nav>
      </aside>

      <article class="article">
        <header class="lesson-head">
          <p class="crumbs"><a href="#/kurs">Kurs</a><span>/</span><span>${esc(module.title)}</span></p>
          <h1>${esc(lesson.title)}</h1>
          <div class="lesson-tags" id="lesson-tags">
            <span class="chip">${icon('clock')} ${lesson.minutes} Min.</span>
            <span class="chip">${icon('bolt')} ${lesson.xp} XP</span>
            <span class="chip">${icon('quiz')} ${lesson.quiz.length} Fragen</span>
            ${done.has(lesson.id) ? `<span class="chip chip-ok">${icon('check')} Abgeschlossen</span>` : ''}
          </div>
        </header>

        <div class="prose" id="prose">${lesson.html}</div>

        <form class="quiz" id="quiz" novalidate>
          <div class="quiz-head">
            <h2>${icon('quiz')} Quiz zur Lektion</h2>
            <span class="chip">${lesson.quiz.length} Fragen · alle müssen stimmen</span>
          </div>
          ${quizHtml(lesson)}
          <div class="quiz-actions">
            <button class="btn btn-primary" type="submit">Antworten prüfen</button>
            ${store.me ? '' : '<span class="hint">Ohne Konto wird das Ergebnis nicht gespeichert.</span>'}
          </div>
          <div class="quiz-result" id="quiz-result" role="status"></div>
        </form>

        <nav class="lesson-nav" aria-label="Vorige und nächste Lektion">
          ${lesson.prev
            ? `<a class="nav-card card" href="#/kurs/${lesson.prev.id}"><span>${icon('arrowLeft')} Zurück</span><b>${esc(lesson.prev.title)}</b></a>`
            : '<span></span>'}
          ${lesson.next
            ? `<a class="nav-card card next" href="#/kurs/${lesson.next.id}"><span>Weiter ${icon('arrowRight')}</span><b>${esc(lesson.next.title)}</b></a>`
            : `<a class="nav-card card next" href="#/kurs"><span>Geschafft ${icon('check')}</span><b>Zur Kursübersicht</b></a>`}
        </nav>
      </article>
    </div>`;

  // --- Inhaltsverzeichnis aus den Zwischenüberschriften ---
  const headings = $$('#prose h2', root);
  const toc = $('#toc', root);
  if (headings.length) {
    toc.innerHTML = headings.map((heading, index) => `<li><a href="${esc(location.hash)}" data-index="${index}">${esc(heading.textContent)}</a></li>`).join('');
    toc.addEventListener('click', (event) => {
      const link = event.target.closest('a[data-index]');
      if (!link) return;
      event.preventDefault();
      headings[Number(link.dataset.index)].scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  } else {
    toc.closest('.toc-block').remove();
  }
  const tocLinks = $$('a', toc);

  // --- Kopierknopf an Codeblöcken ---
  if (navigator.clipboard) {
    for (const block of $$('pre.code', root)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-btn';
      button.innerHTML = `${icon('copy')}<span>Kopieren</span>`;
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(block.querySelector('code').textContent);
          button.lastChild.textContent = 'Kopiert';
          setTimeout(() => { button.lastChild.textContent = 'Kopieren'; }, 1600);
        } catch {
          toast('Kopieren ist hier nicht möglich.', 'warn');
        }
      });
      block.append(button);
    }
  }

  // --- Lesefortschritt und aktiver Abschnitt ---
  const readBar = $('#read-bar', root);
  function onScroll() {
    const range = document.documentElement.scrollHeight - window.innerHeight;
    readBar.style.setProperty('--p', range > 0 ? Math.min(100, (window.scrollY / range) * 100) : 0);
    let active = -1;
    headings.forEach((heading, index) => {
      if (heading.getBoundingClientRect().top < 140) active = index;
    });
    tocLinks.forEach((link, index) => link.classList.toggle('is-active', index === active));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Quiz ---
  const form = $('#quiz', root);
  const resultBox = $('#quiz-result', root);
  const submit = $('button[type="submit"]', form);

  form.addEventListener('change', (event) => {
    event.target.closest('.q')?.classList.remove('is-right', 'is-wrong');
    resultBox.className = 'quiz-result';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const answers = lesson.quiz.map((_, index) => {
      const checked = form.querySelector(`input[name="q${index}"]:checked`);
      return checked ? Number(checked.value) : null;
    });
    const missing = answers.indexOf(null);
    if (missing !== -1) {
      toast('Bitte beantworte jede Frage.', 'warn');
      form.querySelector(`[data-q="${missing}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    submit.disabled = true;
    try {
      const result = await api(`/lessons/${lesson.id}/quiz`, { answers });
      result.results.forEach((entry, index) => {
        const block = form.querySelector(`[data-q="${index}"]`);
        block.classList.toggle('is-right', entry.correct);
        block.classList.toggle('is-wrong', !entry.correct);
        $('.q-icon', block).innerHTML = icon(entry.correct ? 'check' : 'x');
        $('.q-text', block).textContent = entry.explanation;
      });

      if (result.passed) {
        let message = 'Alles richtig. Mit einem Konto würde dieser Abschluss gespeichert.';
        if (result.xpAwarded) message = `Alles richtig. ${result.xpAwarded} Punkte sind gutgeschrieben.`;
        else if (result.saved) message = 'Alles richtig. Diese Lektion hattest du schon abgeschlossen.';
        const target = lesson.next
          ? `<a class="btn btn-primary" href="#/kurs/${lesson.next.id}">Nächste Lektion ${icon('arrowRight')}</a>`
          : `<a class="btn btn-primary" href="#/profil">Zum Profil ${icon('arrowRight')}</a>`;
        resultBox.className = 'quiz-result show ok';
        resultBox.innerHTML = `<div><strong>Lektion abgeschlossen</strong><p>${message}</p></div>${store.me ? target : `<a class="btn btn-ghost" href="#/registrieren">Konto erstellen</a>${target}`}`;
        const box = submit.getBoundingClientRect();
        burst(box.left + box.width / 2, box.top);
        if (result.saved) {
          await loadMe();
          $('#side-list', root).innerHTML = sideList(module, lesson, doneLessons());
          if (!$('.chip-ok', root)) {
            $('#lesson-tags', root).insertAdjacentHTML('beforeend', `<span class="chip chip-ok">${icon('check')} Abgeschlossen</span>`);
          }
        }
        if (result.xpAwarded) toast(`+${result.xpAwarded} XP`, 'ok');
      } else {
        const right = result.results.filter((entry) => entry.correct).length;
        resultBox.className = 'quiz-result show no';
        resultBox.innerHTML = `<div><strong>${right} von ${result.results.length} richtig</strong><p>Lies die Erklärungen unter den Fragen und versuche es noch einmal.</p></div>`;
      }
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      submit.disabled = false;
    }
  });

  return () => window.removeEventListener('scroll', onScroll);
}
