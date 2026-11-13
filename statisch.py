#!/usr/bin/env python3
"""Baut die statische Ausgabe von Einfallstor, zum Beispiel für GitHub Pages.

Aufruf:  python statisch.py                          (Ergebnis im Ordner dist)
         python statisch.py --seiten meine-seiten    (mit impressum.md und datenschutz.md aus dem Ordner)

Alles, was im Ergebnis steht, ist nach dem Hochladen öffentlich lesbar, auch der
Text der Betreiberseiten. Der Ordner dist gehört deshalb nicht ins Repository.

Die statische Ausgabe kommt ohne Server aus. Kurs, Quiz, Übungsterminal und
Werkzeuge laufen im Browser, der Fortschritt liegt im Speicher des Browsers.
Konten und eine gemeinsame Rangliste gibt es nur mit server.py.

Weil alles im Browser geschieht, stehen die Quizlösungen in der Datei
daten.json. Wer will, kann sie dort nachlesen. Von den Missionen stehen dort
nur die Prüfsummen der Lösungswörter.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path

from backend import api, content

ROOT = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT / "public"

# GitHub Pages kann keine eigenen Kopfzeilen senden. Die Content Security Policy
# steht deshalb als meta-Element in der Seite. Sie verbietet alles und erlaubt
# dann nur, was die Seite braucht: eigene Skripte, Stile und Bilder sowie das
# Laden von daten.json. Formulare schickt die Seite nie ab, das erledigt JavaScript.
# frame-ancestors wirkt in einem meta-Element nicht. Gegen die Einbettung in
# fremde Seiten prüft public/js/app.js beim Start, ob die Seite in einem Frame läuft.
CSP = (
    "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; "
    "connect-src 'self'; base-uri 'none'; form-action 'none'"
)
CHARSET = '<meta charset="utf-8">'


def collect(pages_dir: Path | None = None) -> dict:
    """Alles, was sonst die API liefert, als ein Datensatz für den Browser."""
    course = content.load_course()
    terminal = content.load_terminal()
    content.check_mission_lessons(course, terminal)

    lessons = {}
    for lesson in course.lessons:
        previous, following = course.neighbors(lesson["id"])
        lessons[lesson["id"]] = {
            "id": lesson["id"],
            "title": lesson["title"],
            "minutes": lesson["minutes"],
            "xp": lesson["xp"],
            "module": {"id": lesson["module_id"], "title": lesson["module_title"]},
            "html": lesson["html"],
            "quiz": lesson["quiz"],
            "prev": previous,
            "next": following,
        }

    missions = []
    for mission in terminal.public["missions"]:
        solution = api.normalize_answer(terminal.missions[mission["id"]]["solution"])
        missions.append({**mission, "hash": hashlib.sha256(solution.encode("utf-8")).hexdigest()})

    pages = content.load_pages(pages_dir) if pages_dir else {}
    return {
        "stats": api.course_stats(course, terminal),
        "levels": api.LEVELS,
        "course": course.outline,
        "lessons": lessons,
        "terminal": {**terminal.public, "missions": missions},
        "glossary": content.load_glossary(),
        "pages": {name: {"title": page["title"], "html": page["html"]} for name, page in pages.items()},
        "placeholders": {name: page["placeholders"] for name, page in pages.items() if page["placeholders"]},
    }


def build(target: Path, pages_dir: Path | None = None) -> dict:
    """Schreibt die statische Ausgabe nach `target` und gibt den Datensatz zurück."""
    data = collect(pages_dir)
    notes = data.pop("placeholders")

    shutil.copytree(PUBLIC_DIR, target, dirs_exist_ok=True)
    (target / "daten.json").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

    index = target / "index.html"
    html = index.read_text(encoding="utf-8")
    if CHARSET not in html:
        raise SystemExit("public/index.html enthält die erwartete Zeile mit dem Zeichensatz nicht.")
    marker = (
        f'{CHARSET}\n  <meta name="einfallstor-modus" content="statisch">'
        f'\n  <meta http-equiv="Content-Security-Policy" content="{CSP}">'
        '\n  <meta name="referrer" content="no-referrer">'
    )
    index.write_text(html.replace(CHARSET, marker, 1), encoding="utf-8")

    data["placeholders"] = notes
    return data


def main() -> None:
    parser = argparse.ArgumentParser(description="Baut die statische Ausgabe von Einfallstor")
    parser.add_argument("--ziel", default=str(ROOT / "dist"), help="Zielordner, Standard dist")
    parser.add_argument("--seiten", help="Ordner mit impressum.md und datenschutz.md des Betreibers")
    args = parser.parse_args()

    target = Path(args.ziel).resolve()
    # Nicht ins Projekt selbst und nicht in public hinein, sonst kopiert sich der Ordner in sich selbst.
    if target in (ROOT, PUBLIC_DIR) or target in ROOT.parents or PUBLIC_DIR in target.parents:
        raise SystemExit(f"{target} ist als Zielordner nicht erlaubt.")
    data = build(target, Path(args.seiten) if args.seiten else None)

    stats = data["stats"]
    print(f"Statische Ausgabe in {target}")
    print(f"{stats['modules']} Module, {stats['lessons']} Lektionen, {stats['questions']} Quizfragen, {stats['missions']} Missionen")
    for name, title in content.PAGES.items():
        if name not in data["pages"]:
            print(f"Hinweis: {title} fehlt. Eine öffentliche Seite braucht sie in aller Regel.")
        elif name in data["placeholders"]:
            print(f"Hinweis: {title} enthält noch Platzhalter, zum Beispiel {data['placeholders'][name][0]}.")
    print("Zum Ansehen:  python -m http.server 8000 --directory " + str(target))


if __name__ == "__main__":
    main()
