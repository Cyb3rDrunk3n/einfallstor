"""Die API: eine Funktion je Endpunkt, am Dateiende die Routentabelle."""
from __future__ import annotations

import hmac
import re
import sqlite3
import time
from dataclasses import dataclass
from pathlib import Path

from . import content, db, security

SESSION_SECONDS = 30 * 24 * 3600
USERNAME = re.compile(r"[A-Za-z0-9_-]{3,20}")
PASSWORD_MIN, PASSWORD_MAX = 10, 128
LOGIN_FAILED = "Benutzername oder Passwort stimmen nicht."
LEVELS = [
    (0, "Neuling"),
    (100, "Lehrling"),
    (300, "Spürnase"),
    (600, "Analyst"),
    (900, "Prüfer"),
    (1200, "Torwächter"),
]


class ApiError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def course_stats(course: content.Course, terminal: content.Terminal) -> dict:
    """Kennzahlen für Startseite und Profil. Auch die statische Ausgabe nutzt sie."""
    return {
        "modules": len(course.modules),
        "lessons": len(course.lessons),
        "questions": sum(len(lesson["quiz"]) for lesson in course.lessons),
        "missions": len(terminal.missions),
        "minutes": sum(lesson["minutes"] for lesson in course.lessons),
        "xp": sum(lesson["xp"] for lesson in course.lessons)
        + sum(mission["xp"] for mission in terminal.missions.values()),
    }


def normalize_answer(answer: str) -> str:
    """Vergleichsform eines Lösungsworts: ohne Randleerzeichen, Groß- und Kleinschreibung egal."""
    return " ".join(answer.split()).casefold()


class App:
    """Alles, was der Server zur Laufzeit braucht: Inhalte, Datenbank, Begrenzer."""

    def __init__(self, db_path: str):
        self.db_path = str(db_path)
        db.init(self.db_path)
        self.course = content.load_course()
        self.terminal = content.load_terminal()
        self.glossary = content.load_glossary()
        self.pages_dir = Path(self.db_path).parent / "seiten"
        self.pages = content.load_pages(self.pages_dir)
        for mission in self.terminal.missions.values():
            lesson = mission.get("lesson")
            if lesson and lesson not in self.course.by_id:
                raise content.ContentError(f"Mission {mission['id']} verweist auf unbekannte Lektion {lesson}")
        self.stats = course_stats(self.course, self.terminal)
        self.limits = {
            "login": security.RateLimiter(limit=10, window=60),
            "register": security.RateLimiter(limit=10, window=600),
            "answer": security.RateLimiter(limit=60, window=60),
        }

    def page_notes(self, public: bool) -> list[str]:
        """Hinweise für den Start: offene Platzhalter und, im öffentlichen Betrieb, fehlende Seiten."""
        notes = []
        for name, title in content.PAGES.items():
            page = self.pages.get(name)
            if page is None:
                if public:
                    notes.append(f"{title} fehlt. Erwartet wird die Datei {self.pages_dir / (name + '.md')}.")
            elif page["placeholders"]:
                notes.append(f"{title} enthält noch Platzhalter, zum Beispiel {page['placeholders'][0]}.")
        return notes


@dataclass
class Request:
    app: App
    conn: sqlite3.Connection
    ip: str
    body: dict
    params: tuple
    user: sqlite3.Row | None
    token_hash: str | None
    secure: bool
    cookie: str | None = None


# --- Helfer -------------------------------------------------------------------


def _now() -> int:
    return int(time.time())


def _limit(req: Request, name: str) -> None:
    if not req.app.limits[name].allow(req.ip):
        raise ApiError(429, "Zu viele Versuche. Warte einen Moment und probiere es dann erneut.")


def _require_user(req: Request) -> sqlite3.Row:
    if req.user is None:
        raise ApiError(401, "Dafür musst du angemeldet sein.")
    return req.user


def _start_session(req: Request, user_id: int) -> None:
    token, token_hash = security.new_session_token()
    req.conn.execute(
        "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
        (token_hash, user_id, _now() + SESSION_SECONDS),
    )
    req.cookie = security.session_cookie(token, SESSION_SECONDS, req.secure)


def _clear_cookie(req: Request) -> None:
    req.cookie = security.session_cookie("", 0, req.secure)


def _level(xp: int) -> dict:
    index = max(i for i, (needed, _) in enumerate(LEVELS) if xp >= needed)
    following = LEVELS[index + 1][0] if index + 1 < len(LEVELS) else None
    return {"number": index + 1, "title": LEVELS[index][1], "floor": LEVELS[index][0], "next": following}


def _summary(req: Request) -> dict:
    """Stand eines Benutzers: Punkte, Rang, Erledigtes und Abzeichen."""
    app, user = req.app, req.user
    rows = req.conn.execute(
        "SELECT kind, item_id, xp, done_at FROM progress WHERE user_id = ?", (user["id"],)
    ).fetchall()
    lessons = [row for row in rows if row["kind"] == "lesson" and row["item_id"] in app.course.by_id]
    missions = [row for row in rows if row["kind"] == "mission" and row["item_id"] in app.terminal.missions]
    done_lessons = {row["item_id"] for row in lessons}
    xp = sum(row["xp"] for row in lessons) + sum(row["xp"] for row in missions)
    course_done = len(done_lessons) == len(app.course.lessons)

    badges = [{"id": "start", "title": "Erste Lektion", "icon": "flag", "earned": bool(done_lessons)}]
    for module in app.course.modules:
        earned = all(lesson["id"] in done_lessons for lesson in module["lessons"])
        badges.append({"id": f"modul-{module['id']}", "title": module["title"], "icon": module["icon"], "earned": earned})
    badges.append(
        {"id": "terminal", "title": "Alle Missionen", "icon": "terminal", "earned": len(missions) == len(app.terminal.missions)}
    )
    badges.append({"id": "kurs", "title": "Kurs abgeschlossen", "icon": "trophy", "earned": course_done})

    return {
        "name": user["username"],
        "since": user["created_at"],
        "xp": xp,
        "level": _level(xp),
        "doneLessons": sorted(done_lessons),
        "doneMissions": sorted(row["item_id"] for row in missions),
        "badges": badges,
        "completedAt": max(row["done_at"] for row in lessons) if course_done else None,
    }


def _award(req: Request, kind: str, item_id: str, xp: int) -> int:
    """Trägt den Abschluss ein und gibt die neu vergebenen Punkte zurück (0 bei Wiederholung)."""
    if req.user is None:
        return 0
    cursor = req.conn.execute(
        "INSERT OR IGNORE INTO progress (user_id, kind, item_id, xp, done_at) VALUES (?, ?, ?, ?, ?)",
        (req.user["id"], kind, item_id, xp, _now()),
    )
    return xp if cursor.rowcount == 1 else 0


def _lesson(req: Request) -> dict:
    lesson = req.app.course.by_id.get("/".join(req.params))
    if lesson is None:
        raise ApiError(404, "Diese Lektion gibt es nicht.")
    return lesson


# --- Endpunkte ----------------------------------------------------------------


def get_me(req: Request):
    return 200, {
        "user": _summary(req) if req.user else None,
        "stats": req.app.stats,
        "pages": sorted(req.app.pages),  # welche Betreiberseiten es gibt, für die Fußzeile
    }


def get_page(req: Request):
    page = req.app.pages.get(req.params[0])
    if page is None:
        raise ApiError(404, "Diese Seite gibt es nicht.")
    return 200, {"title": page["title"], "html": page["html"]}


def get_course(req: Request):
    return 200, {"modules": req.app.course.outline}


def get_lesson(req: Request):
    lesson = _lesson(req)
    previous, following = req.app.course.neighbors(lesson["id"])
    return 200, {
        "id": lesson["id"],
        "title": lesson["title"],
        "minutes": lesson["minutes"],
        "xp": lesson["xp"],
        "module": {"id": lesson["module_id"], "title": lesson["module_title"]},
        "html": lesson["html"],
        "quiz": [{"question": q["question"], "options": q["options"]} for q in lesson["quiz"]],
        "prev": previous,
        "next": following,
    }


def post_quiz(req: Request):
    _limit(req, "answer")
    lesson = _lesson(req)
    quiz = lesson["quiz"]
    answers = req.body.get("answers")
    valid = (
        isinstance(answers, list)
        and len(answers) == len(quiz)
        and all(type(answer) is int and 0 <= answer < len(q["options"]) for answer, q in zip(answers, quiz))
    )
    if not valid:
        raise ApiError(400, "Bitte beantworte jede Frage.")
    results = [{"correct": answer == q["answer"], "explanation": q["explanation"]} for answer, q in zip(answers, quiz)]
    passed = all(result["correct"] for result in results)
    awarded = _award(req, "lesson", lesson["id"], lesson["xp"]) if passed else 0
    return 200, {"passed": passed, "results": results, "xpAwarded": awarded, "saved": passed and req.user is not None}


def get_terminal(req: Request):
    return 200, req.app.terminal.public


def post_mission(req: Request):
    _limit(req, "answer")
    mission = req.app.terminal.missions.get(req.params[0])
    if mission is None:
        raise ApiError(404, "Diese Mission gibt es nicht.")
    answer = req.body.get("answer")
    if not isinstance(answer, str) or not answer.strip() or len(answer) > 200:
        raise ApiError(400, "Bitte gib ein Lösungswort ein.")
    correct = hmac.compare_digest(normalize_answer(answer).encode(), normalize_answer(mission["solution"]).encode())
    awarded = _award(req, "mission", mission["id"], mission["xp"]) if correct else 0
    return 200, {"correct": correct, "xpAwarded": awarded, "saved": correct and req.user is not None}


def get_glossary(req: Request):
    return 200, {"entries": req.app.glossary}


def get_leaderboard(req: Request):
    rows = req.conn.execute(
        """
        SELECT u.username, SUM(p.xp) AS xp, COUNT(*) AS items, MAX(p.done_at) AS last_done
        FROM users u JOIN progress p ON p.user_id = u.id
        GROUP BY u.id
        ORDER BY xp DESC, last_done ASC
        LIMIT 25
        """
    ).fetchall()
    return 200, {
        "entries": [
            {"name": row["username"], "xp": row["xp"], "items": row["items"], "level": _level(row["xp"])["title"]}
            for row in rows
        ]
    }


def post_register(req: Request):
    username, password = req.body.get("username"), req.body.get("password")
    if not isinstance(username, str) or not USERNAME.fullmatch(username):
        raise ApiError(400, "Der Benutzername braucht 3 bis 20 Zeichen: Buchstaben, Ziffern, Bindestrich oder Unterstrich.")
    if not isinstance(password, str) or not PASSWORD_MIN <= len(password) <= PASSWORD_MAX:
        raise ApiError(400, f"Das Passwort braucht mindestens {PASSWORD_MIN} Zeichen.")
    if password.casefold() == username.casefold():
        raise ApiError(400, "Das Passwort darf nicht dem Benutzernamen entsprechen.")
    if req.body.get("accept") is not True:
        raise ApiError(400, "Bitte bestätige den Kodex.")
    _limit(req, "register")  # erst hier, damit Tippfehler im Formular nicht mitzählen
    digest, salt = security.hash_password(password)
    try:
        cursor = req.conn.execute(
            "INSERT INTO users (username, pw_hash, pw_salt, created_at) VALUES (?, ?, ?, ?)",
            (username, digest, salt, _now()),
        )
    except sqlite3.IntegrityError:
        raise ApiError(409, "Dieser Benutzername ist schon vergeben.") from None
    _start_session(req, cursor.lastrowid)
    req.user = req.conn.execute(
        "SELECT id, username, created_at FROM users WHERE id = ?", (cursor.lastrowid,)
    ).fetchone()
    return 201, {"user": _summary(req)}


def post_login(req: Request):
    _limit(req, "login")
    username, password = req.body.get("username"), req.body.get("password")
    if not isinstance(username, str) or not isinstance(password, str):
        raise ApiError(400, "Benutzername und Passwort fehlen.")
    row = None
    if len(username) <= 20 and len(password) <= PASSWORD_MAX:
        row = req.conn.execute(
            "SELECT id, username, created_at, pw_hash, pw_salt FROM users WHERE username = ?", (username,)
        ).fetchone()
    if row is None:
        # Auch ohne Konto wird gerechnet. Sonst ließe sich an der Antwortzeit
        # ablesen, welche Benutzernamen es gibt.
        security.hash_password(password[:PASSWORD_MAX])
        raise ApiError(401, LOGIN_FAILED)
    if not security.verify_password(password, row["pw_hash"], row["pw_salt"]):
        raise ApiError(401, LOGIN_FAILED)
    req.conn.execute("DELETE FROM sessions WHERE expires_at < ?", (_now(),))
    _start_session(req, row["id"])
    req.user = row
    return 200, {"user": _summary(req)}


def post_logout(req: Request):
    if req.token_hash:
        req.conn.execute("DELETE FROM sessions WHERE token_hash = ?", (req.token_hash,))
    _clear_cookie(req)
    return 200, {"ok": True}


def post_delete_account(req: Request):
    user = _require_user(req)
    _limit(req, "login")
    password = req.body.get("password")
    row = req.conn.execute("SELECT pw_hash, pw_salt FROM users WHERE id = ?", (user["id"],)).fetchone()
    if not isinstance(password, str) or len(password) > PASSWORD_MAX or not security.verify_password(
        password, row["pw_hash"], row["pw_salt"]
    ):
        raise ApiError(403, "Das Passwort stimmt nicht.")
    # ON DELETE CASCADE entfernt Sitzungen und Fortschritt gleich mit.
    req.conn.execute("DELETE FROM users WHERE id = ?", (user["id"],))
    _clear_cookie(req)
    return 200, {"ok": True}


_SLUG = r"([a-z0-9-]+)"
ROUTES = [
    ("GET", re.compile(r"/api/me"), get_me),
    ("GET", re.compile(r"/api/course"), get_course),
    ("GET", re.compile(rf"/api/lessons/{_SLUG}/{_SLUG}"), get_lesson),
    ("POST", re.compile(rf"/api/lessons/{_SLUG}/{_SLUG}/quiz"), post_quiz),
    ("GET", re.compile(r"/api/terminal"), get_terminal),
    ("POST", re.compile(rf"/api/missions/{_SLUG}"), post_mission),
    ("GET", re.compile(r"/api/glossary"), get_glossary),
    ("GET", re.compile(rf"/api/pages/{_SLUG}"), get_page),
    ("GET", re.compile(r"/api/leaderboard"), get_leaderboard),
    ("POST", re.compile(r"/api/register"), post_register),
    ("POST", re.compile(r"/api/login"), post_login),
    ("POST", re.compile(r"/api/logout"), post_logout),
    ("POST", re.compile(r"/api/account/delete"), post_delete_account),
]
