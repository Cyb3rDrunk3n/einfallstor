// Statische Ausgabe: Diese Datei ersetzt den Server.
//
// statisch.py legt alle Inhalte in daten.json ab. Hier werden dieselben Anfragen
// beantwortet, die sonst an /api gehen, mit denselben Antworten. Der Fortschritt
// liegt im Speicher des Browsers (localStorage) und verlässt das Gerät nicht.
// Konten gibt es in dieser Ausgabe nicht, es gibt genau ein lokales Profil.

import { ApiError, toast } from './lib.js';

const KEY = 'einfallstor.fortschritt.v1';
const now = () => Math.floor(Date.now() / 1000);

let dataPromise = null;
let fallback = null; // Fortschritt für diese Sitzung, falls der Browser das Speichern nicht zulässt

function loadData() {
  dataPromise ||= fetch('daten.json').then((response) => {
    if (!response.ok) throw new ApiError(response.status, 'Die Kursdaten ließen sich nicht laden.');
    return response.json();
  });
  return dataPromise;
}

const cleanName = (value) => String(value ?? '').replace(/[^\p{L}\p{N} ._-]/gu, '').trim().slice(0, 30);

/** Nur Einträge der Form { kennung: zeitpunkt } übernehmen. */
const cleanTimes = (value) => Object.fromEntries(
  Object.entries(value && typeof value === 'object' ? value : {}).filter(([, time]) => Number.isFinite(time)),
);

/**
 * Liest den Fortschritt. Der Speicher des Browsers gilt als fremde Eingabe: Alle Seiten unter derselben
 * Adresse teilen ihn sich, und jeder kann ihn von Hand ändern. Übernommen wird deshalb nur, was passt.
 */
function readState() {
  if (fallback) return fallback;
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(KEY));
  } catch {
    // kaputter oder gesperrter Speicher: mit leerem Stand weitermachen
  }
  if (!stored || typeof stored !== 'object') stored = {};
  return {
    name: cleanName(typeof stored.name === 'string' ? stored.name : ''),
    since: Number.isFinite(stored.since) ? stored.since : now(),
    lessons: cleanTimes(stored.lessons),
    missions: cleanTimes(stored.missions),
  };
}

function writeState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Speicher voll oder gesperrt: Der Stand lebt dann nur in dieser Sitzung. Das soll niemand erst beim Neuladen merken.
    if (!fallback) toast('Dein Browser lässt das Speichern nicht zu. Der Fortschritt hält nur, bis du die Seite neu lädst.', 'warn');
    fallback = state;
  }
}

/** Behält nur Einträge zu Lektionen und Missionen, die es gibt. Fremde Einträge werden so beim nächsten Speichern verworfen. */
function prune(state, data) {
  const missionIds = new Set(data.terminal.missions.map((mission) => mission.id));
  const keep = (entries, known) => Object.fromEntries(Object.entries(entries).filter(([id]) => known(id)));
  state.lessons = keep(state.lessons, (id) => Object.hasOwn(data.lessons, id));
  state.missions = keep(state.missions, (id) => missionIds.has(id));
  return state;
}

function clearState() {
  fallback = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nichts zu löschen
  }
}

function level(levels, xp) {
  let index = 0;
  levels.forEach(([needed], position) => {
    if (xp >= needed) index = position;
  });
  return { number: index + 1, title: levels[index][1], floor: levels[index][0], next: levels[index + 1]?.[0] ?? null };
}

/** Stand des lokalen Profils, im selben Aufbau wie die Antwort des Servers. */
function summary(data, state) {
  const missionById = new Map(data.terminal.missions.map((mission) => [mission.id, mission]));
  const lessons = Object.keys(state.lessons).filter((id) => Object.hasOwn(data.lessons, id)).sort();
  const missions = Object.keys(state.missions).filter((id) => missionById.has(id)).sort();
  const done = new Set(lessons);
  const courseDone = done.size === Object.keys(data.lessons).length;
  const xp = lessons.reduce((sum, id) => sum + data.lessons[id].xp, 0)
    + missions.reduce((sum, id) => sum + missionById.get(id).xp, 0);
  return {
    name: state.name || 'Gast',
    since: state.since,
    xp,
    level: level(data.levels, xp),
    doneLessons: lessons,
    doneMissions: missions,
    badges: [
      { id: 'start', title: 'Erste Lektion', icon: 'flag', earned: done.size > 0 },
      ...data.course.map((module) => ({
        id: `modul-${module.id}`,
        title: module.title,
        icon: module.icon,
        earned: module.lessons.every((lesson) => done.has(lesson.id)),
      })),
      { id: 'terminal', title: 'Alle Missionen', icon: 'terminal', earned: missions.length === missionById.size },
      { id: 'kurs', title: 'Kurs abgeschlossen', icon: 'trophy', earned: courseDone },
    ],
    completedAt: courseDone ? Math.max(...lessons.map((id) => state.lessons[id])) : null,
  };
}

function checkQuiz(lesson, state, body) {
  const answers = body?.answers;
  const valid = Array.isArray(answers)
    && answers.length === lesson.quiz.length
    && answers.every((answer, index) => Number.isInteger(answer) && answer >= 0 && answer < lesson.quiz[index].options.length);
  if (!valid) throw new ApiError(400, 'Bitte beantworte jede Frage.');
  const results = lesson.quiz.map((question, index) => ({
    correct: answers[index] === question.answer,
    explanation: question.explanation,
  }));
  const passed = results.every((result) => result.correct);
  let awarded = 0;
  if (passed && !state.lessons[lesson.id]) {
    state.lessons[lesson.id] = now();
    writeState(state);
    awarded = lesson.xp;
  }
  return { passed, results, xpAwarded: awarded, saved: passed };
}

async function checkMission(mission, state, body) {
  const answer = body?.answer;
  if (typeof answer !== 'string' || !answer.trim() || answer.length > 200) throw new ApiError(400, 'Bitte gib ein Lösungswort ein.');
  if (!window.crypto?.subtle) throw new ApiError(400, 'Die Prüfung braucht eine sichere Verbindung (HTTPS oder localhost).');
  const normalized = answer.trim().split(/\s+/).join(' ').toLowerCase();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const correct = hex === mission.hash;
  let awarded = 0;
  if (correct && !state.missions[mission.id]) {
    state.missions[mission.id] = now();
    writeState(state);
    awarded = mission.xp;
  }
  return { correct, xpAwarded: awarded, saved: correct };
}

/** Beantwortet eine Anfrage wie der Server: GET ohne body, POST mit body. */
export async function handle(path, body) {
  const data = await loadData();
  const state = prune(readState(), data);
  let match;

  if (path === '/me') return { user: summary(data, state), stats: data.stats, pages: Object.keys(data.pages) };
  if (path === '/course') return { modules: data.course };
  if (path === '/glossary') return { entries: data.glossary };
  if (path === '/terminal') {
    return { ...data.terminal, missions: data.terminal.missions.map(({ hash, ...mission }) => mission) };
  }
  if ((match = /^\/pages\/([a-z0-9-]+)$/.exec(path))) {
    if (!Object.hasOwn(data.pages, match[1])) throw new ApiError(404, 'Diese Seite gibt es nicht.');
    return data.pages[match[1]];
  }
  if ((match = /^\/lessons\/([a-z0-9-]+\/[a-z0-9-]+)(\/quiz)?$/.exec(path))) {
    if (!Object.hasOwn(data.lessons, match[1])) throw new ApiError(404, 'Diese Lektion gibt es nicht.');
    const lesson = data.lessons[match[1]];
    if (match[2]) return checkQuiz(lesson, state, body);
    return { ...lesson, quiz: lesson.quiz.map(({ question, options }) => ({ question, options })) };
  }
  if ((match = /^\/missions\/([a-z0-9-]+)$/.exec(path))) {
    const mission = data.terminal.missions.find((entry) => entry.id === match[1]);
    if (!mission) throw new ApiError(404, 'Diese Mission gibt es nicht.');
    return checkMission(mission, state, body);
  }
  if (path === '/profile/name') {
    // Nur in der statischen Ausgabe: der Name für die Teilnahmebescheinigung.
    state.name = cleanName(body?.name);
    writeState(state);
    return { user: summary(data, state) };
  }
  if (path === '/account/delete') {
    clearState();
    return { ok: true };
  }
  throw new ApiError(404, 'Das gibt es in der statischen Ausgabe nicht.');
}
