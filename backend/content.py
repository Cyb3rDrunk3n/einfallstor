"""Kursinhalte laden: Markdown-Dateien einlesen, Quizfragen abtrennen, Text zu HTML rendern.

Jedes Modul ist eine Markdown-Datei in content/kurs/ mit diesem Aufbau:

    ---
    titel: Netzwerk-Grundlagen
    kurz: Ein Satz zum Modul.
    icon: netz
    ---

    # Titel der Lektion
    minuten: 10
    xp: 45

    Text der Lektion in Markdown ...

    ?? Frage
    ( ) falsche Antwort
    (x) richtige Antwort
    !! Erklärung, die nach dem Antworten erscheint

Die richtigen Antworten bleiben auf dem Server. An den Browser gehen nur
Fragen und Antwortmöglichkeiten.
"""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

CONTENT_DIR = Path(__file__).resolve().parent.parent / "content"

CALLOUTS = {
    "TIPP": "Tipp",
    "MERKE": "Merke",
    "RECHT": "Recht",
    "ABWEHR": "Abwehr",
    "PRAXIS": "Praxis",
}

_UMLAUTS = str.maketrans({"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss"})
_META = re.compile(r"^(minuten|xp):\s*(\d+)$")
_OPTION = re.compile(r"^\((x| )\) (.+)$")
_CALLOUT = re.compile(r"^\[!([A-Z]+)\]\s*(.*)$")
_LINK = re.compile(r"\[([^\]]+)\]\(((?:https?://|#/)[^\s)]*)\)")
_BOLD = re.compile(r"\*\*(.+?)\*\*")
_ITALIC = re.compile(r"(?<!\w)\*(?=\S)(.+?)(?<=\S)\*(?!\w)")
_BULLET = re.compile(r"^- ")
_ORDERED = re.compile(r"^\d+\. ")


class ContentError(ValueError):
    """Eine Inhaltsdatei hat einen Formfehler."""


def slugify(text: str) -> str:
    text = text.lower().translate(_UMLAUTS)
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


# --- Markdown zu HTML -------------------------------------------------------
# Bewusst klein gehalten: Überschriften, Absätze, Listen, Tabellen, Codeblöcke,
# Hinweiskästen. Jeder Text wird zuerst mit html.escape entschärft, erst danach
# kommen die eigenen Tags dazu. So kann aus den Inhalten nie HTML eingeschleust
# werden.


def _link(match: re.Match) -> str:
    label, url = match.group(1), match.group(2)
    if url.startswith("#/"):
        return f'<a href="{url}">{label}</a>'
    return f'<a href="{url}" target="_blank" rel="noopener noreferrer">{label}</a>'


def _inline(text: str) -> str:
    parts = []
    for part in re.split(r"(`[^`]+`)", text):
        if len(part) > 2 and part.startswith("`") and part.endswith("`"):
            parts.append(f"<code>{html.escape(part[1:-1])}</code>")
            continue
        part = html.escape(part)
        part = _LINK.sub(_link, part)
        part = _BOLD.sub(r"<strong>\1</strong>", part)
        part = _ITALIC.sub(r"<em>\1</em>", part)
        parts.append(part)
    return "".join(parts)


def _starts_block(line: str) -> bool:
    return (
        line.startswith(("```", "## ", "### ", ">", "|"))
        or bool(_BULLET.match(line))
        or bool(_ORDERED.match(line))
    )


def _quote(lines: list[str]) -> str:
    match = _CALLOUT.match(lines[0])
    if match and match.group(1) in CALLOUTS:
        kind = match.group(1)
        text = " ".join(part for part in [match.group(2), *lines[1:]] if part)
        return (
            f'<aside class="callout callout-{kind.lower()}">'
            f'<p class="callout-title">{CALLOUTS[kind]}</p><p>{_inline(text)}</p></aside>'
        )
    return f"<blockquote><p>{_inline(' '.join(part for part in lines if part))}</p></blockquote>"


def _table(rows: list[str]) -> str:
    cells = [[cell.strip() for cell in row.strip().strip("|").split("|")] for row in rows]
    head, body = cells[0], cells[1:]
    if body and all(re.fullmatch(r":?-{2,}:?", cell) for cell in body[0]):
        body = body[1:]
    out = ['<div class="table-wrap"><table><thead><tr>']
    out += [f"<th>{_inline(cell)}</th>" for cell in head]
    out.append("</tr></thead><tbody>")
    for row in body:
        out.append("<tr>" + "".join(f"<td>{_inline(cell)}</td>" for cell in row) + "</tr>")
    out.append("</tbody></table></div>")
    return "".join(out)


def _list(lines: list[str], start: int, pattern: re.Pattern, tag: str) -> tuple[str, int]:
    items = []
    i = start
    while i < len(lines) and pattern.match(lines[i]):
        item = pattern.sub("", lines[i], count=1)
        i += 1
        while i < len(lines) and lines[i].startswith("  ") and lines[i].strip():
            item += " " + lines[i].strip()
            i += 1
        items.append(item)
    body = "".join(f"<li>{_inline(item)}</li>" for item in items)
    return f"<{tag}>{body}</{tag}>", i


def render_markdown(text: str) -> str:
    lines = text.strip("\n").split("\n")
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
        elif line.startswith("```"):
            lang = html.escape(line[3:].strip())
            i += 1
            code = []
            while i < len(lines) and not lines[i].startswith("```"):
                code.append(lines[i])
                i += 1
            i += 1
            out.append(
                f'<pre class="code" data-lang="{lang}"><code>{html.escape(chr(10).join(code))}</code></pre>'
            )
        elif line.startswith("### "):
            out.append(f"<h3>{_inline(line[4:].strip())}</h3>")
            i += 1
        elif line.startswith("## "):
            out.append(f"<h2>{_inline(line[3:].strip())}</h2>")
            i += 1
        elif line.startswith(">"):
            quote = []
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i][1:].strip())
                i += 1
            out.append(_quote(quote))
        elif line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append(lines[i])
                i += 1
            out.append(_table(rows))
        elif _BULLET.match(line):
            block, i = _list(lines, i, _BULLET, "ul")
            out.append(block)
        elif _ORDERED.match(line):
            block, i = _list(lines, i, _ORDERED, "ol")
            out.append(block)
        else:
            # Ein Backslash am Zeilenende erzwingt einen Zeilenumbruch, etwa in einer Anschrift.
            groups = [[]]
            while i < len(lines) and lines[i].strip() and not _starts_block(lines[i]):
                line = lines[i].strip()
                if line.endswith("\\"):
                    groups[-1].append(line[:-1].rstrip())
                    groups.append([])
                else:
                    groups[-1].append(line)
                i += 1
            out.append("<p>" + "<br>".join(_inline(" ".join(group)) for group in groups if group) + "</p>")
    return "\n".join(out)


# --- Kurs --------------------------------------------------------------------


class Course:
    def __init__(self, modules: list[dict]):
        self.modules = modules
        self.lessons = [lesson for module in modules for lesson in module["lessons"]]
        self.by_id = {lesson["id"]: lesson for lesson in self.lessons}
        if len(self.by_id) != len(self.lessons):
            raise ContentError("Zwei Lektionen haben dieselbe ID.")
        # Gliederung für den Browser: ohne Texte und ohne Lösungen.
        self.outline = [
            {
                "id": module["id"],
                "title": module["title"],
                "summary": module["summary"],
                "icon": module["icon"],
                "lessons": [
                    {key: lesson[key] for key in ("id", "title", "minutes", "xp")}
                    for lesson in module["lessons"]
                ],
            }
            for module in modules
        ]

    def neighbors(self, lesson_id: str) -> tuple[dict | None, dict | None]:
        index = self.lessons.index(self.by_id[lesson_id])

        def brief(position: int) -> dict | None:
            if 0 <= position < len(self.lessons):
                lesson = self.lessons[position]
                return {"id": lesson["id"], "title": lesson["title"]}
            return None

        return brief(index - 1), brief(index + 1)


def _parse_lessons(body: str, module: dict, source: str) -> list[dict]:
    lessons = []
    current = None
    in_code = False
    in_head = False
    for raw in body.split("\n"):
        line = raw.rstrip()
        if line.startswith("```"):
            in_code = not in_code
        if not in_code and line.startswith("# "):
            current = {"title": line[2:].strip(), "minuten": 8, "xp": 40, "lines": [], "quiz": []}
            lessons.append(current)
            in_head = True
            continue
        if current is None:
            if line.strip():
                raise ContentError(f"{source}: Text vor der ersten Lektion")
            continue
        if in_head:
            meta = _META.match(line)
            if meta:
                current[meta.group(1)] = int(meta.group(2))
                continue
            in_head = False
        if not in_code and line.startswith("?? "):
            current["quiz"].append(
                {"question": line[3:].strip(), "options": [], "answer": None, "explanation": ""}
            )
            continue
        if not in_code and current["quiz"]:
            question = current["quiz"][-1]
            option = _OPTION.match(line)
            if option:
                if option.group(1) == "x":
                    if question["answer"] is not None:
                        raise ContentError(f"{source}: Frage mit zwei richtigen Antworten: {question['question']}")
                    question["answer"] = len(question["options"])
                question["options"].append(option.group(2).strip())
                continue
            if line.startswith("!! "):
                question["explanation"] = line[3:].strip()
                continue
        current["lines"].append(line)

    result = []
    for entry in lessons:
        slug = slugify(entry["title"])
        if not slug:
            raise ContentError(f"{source}: Lektion ohne brauchbaren Titel")
        if not entry["quiz"]:
            raise ContentError(f"{source}: Lektion ohne Quiz: {entry['title']}")
        for question in entry["quiz"]:
            if len(question["options"]) < 2 or question["answer"] is None:
                raise ContentError(f"{source}: Frage unvollständig: {question['question']}")
        result.append(
            {
                "id": f"{module['id']}/{slug}",
                "module_id": module["id"],
                "module_title": module["title"],
                "title": entry["title"],
                "minutes": entry["minuten"],
                "xp": entry["xp"],
                "html": render_markdown("\n".join(entry["lines"])),
                "quiz": entry["quiz"],
            }
        )
    return result


def _parse_module(path: Path) -> dict:
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    if not text.startswith("---\n"):
        raise ContentError(f"{path.name}: Kopfbereich zwischen --- fehlt")
    _, head, body = text.split("---", 2)
    meta = {}
    for line in head.strip().split("\n"):
        key, _, value = line.partition(":")
        meta[key.strip()] = value.strip()
    module_id = re.sub(r"^\d+-", "", path.stem)
    if not re.fullmatch(r"[a-z0-9-]+", module_id) or "titel" not in meta:
        raise ContentError(f"{path.name}: Dateiname oder Titel ungültig")
    module = {
        "id": module_id,
        "title": meta["titel"],
        "summary": meta.get("kurz", ""),
        "icon": meta.get("icon", "book"),
    }
    module["lessons"] = _parse_lessons(body, module, path.name)
    if not module["lessons"]:
        raise ContentError(f"{path.name}: Modul ohne Lektionen")
    return module


def load_course(directory: Path = CONTENT_DIR / "kurs") -> Course:
    modules = [_parse_module(path) for path in sorted(directory.glob("*.md"))]
    if not modules:
        raise ContentError(f"Keine Kursdateien in {directory}")
    return Course(modules)


# --- Übungsterminal und Glossar ---------------------------------------------


class Terminal:
    """Dateisystem und Missionen des Übungsterminals.

    `public` geht an den Browser, die Lösungswörter bleiben in `missions`.
    """

    def __init__(self, data: dict):
        self.missions = {mission["id"]: mission for mission in data["missions"]}
        if len(self.missions) != len(data["missions"]):
            raise ContentError("terminal.json: Zwei Missionen haben dieselbe ID.")
        for mission in data["missions"]:
            if not str(mission.get("solution", "")).strip():
                raise ContentError(f"terminal.json: Mission ohne Lösung: {mission['id']}")
        self.public = {
            "host": data["host"],
            "user": data["user"],
            "dirs": data.get("dirs", {}),
            "files": data["files"],
            "missions": [
                {key: value for key, value in mission.items() if key != "solution"}
                for mission in data["missions"]
            ],
        }


def load_terminal(path: Path = CONTENT_DIR / "terminal.json") -> Terminal:
    return Terminal(json.loads(path.read_text(encoding="utf-8")))


def load_glossary(path: Path = CONTENT_DIR / "glossar.json") -> list[dict]:
    entries = json.loads(path.read_text(encoding="utf-8"))
    return sorted(entries, key=lambda entry: entry["term"].lower().translate(_UMLAUTS))


# --- Impressum und Datenschutzerklärung -------------------------------------
# Diese Seiten gehören zum Betreiber, nicht zum Projekt. Sie liegen deshalb
# außerhalb des Repositorys im Ordner "seiten" neben der Datenbank. Vorlagen
# zum Ausfüllen stehen in content/rechtliches/.

PAGES = {"impressum": "Impressum", "datenschutz": "Datenschutzerklärung"}

# Platzhalter der Vorlagen: Großbuchstaben in eckigen Klammern, zum Beispiel [E-MAIL-ADRESSE].
_PLACEHOLDER = re.compile(r"\[[A-ZÄÖÜ0-9][A-ZÄÖÜ0-9 ,.:/-]{2,}\]")


def load_pages(directory: Path) -> dict[str, dict]:
    """Liest die vorhandenen Betreiberseiten. Fehlende Dateien sind kein Fehler."""
    pages = {}
    for name, title in PAGES.items():
        path = directory / f"{name}.md"
        if path.is_file():
            text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
            pages[name] = {
                "title": title,
                "html": render_markdown(text),
                "placeholders": sorted(set(_PLACEHOLDER.findall(text))),
            }
    return pages
