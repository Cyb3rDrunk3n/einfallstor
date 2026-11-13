"""Tests für Inhalte und API.

Aufruf im Projektordner:  python -m unittest discover -s tests -v

Jede Testklasse startet einen eigenen Server auf einem freien Port mit einer
leeren Datenbank in einem temporären Ordner.
"""
import hashlib
import http.client
import json
import shutil
import sys
import tempfile
import threading
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import server  # noqa: E402
import statisch  # noqa: E402
from backend import api, content  # noqa: E402

server.Handler.log_message = lambda *args: None  # Zugriffsprotokoll im Test stumm schalten

PASSWORD = "nur-fuer-den-test-1"


class Client:
    """Kleiner HTTP-Client, der sich das Sitzungs-Cookie merkt."""

    def __init__(self, port):
        self.port = port
        self.cookie = None

    def request(self, method, path, body=None, headers=None, raw=None):
        headers = dict(headers or {})
        data = raw
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers.setdefault("Content-Type", "application/json")
        if self.cookie:
            headers["Cookie"] = self.cookie
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=15)
        try:
            conn.request(method, path, body=data, headers=headers)
            response = conn.getresponse()
            payload = response.read()
        finally:
            conn.close()
        set_cookie = response.getheader("Set-Cookie")
        if set_cookie:
            pair = set_cookie.split(";")[0]
            self.cookie = None if pair == "sid=" else pair
        if response.getheader("Content-Type", "").startswith("application/json"):
            payload = json.loads(payload)
        return response, payload

    def get(self, path):
        return self.request("GET", path)

    def post(self, path, body=None, headers=None):
        return self.request("POST", path, {} if body is None else body, headers)


class ServerCase(unittest.TestCase):
    behind_proxy = False
    pages = {}  # Betreiberseiten für diesen Server: Name -> Markdown-Text

    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp(prefix="einfallstor-test-")
        for name, text in cls.pages.items():
            folder = Path(cls.tmp) / "seiten"
            folder.mkdir(exist_ok=True)
            (folder / f"{name}.md").write_text(text, encoding="utf-8")
        cls.server = server.create_server("127.0.0.1", 0, str(Path(cls.tmp) / "test.db"), cls.behind_proxy)
        cls.port = cls.server.server_address[1]
        cls.app = cls.server.app
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def client(self):
        return Client(self.port)

    def register(self, name):
        client = self.client()
        response, data = client.post("/api/register", {"username": name, "password": PASSWORD, "accept": True})
        self.assertEqual(response.status, 201, data)
        return client

    def right_answers(self, lesson_id):
        return [question["answer"] for question in self.app.course.by_id[lesson_id]["quiz"]]


class ContentTests(unittest.TestCase):
    def test_course_is_complete(self):
        course = content.load_course()
        self.assertGreaterEqual(len(course.modules), 8)
        self.assertGreaterEqual(len(course.lessons), 20)
        for lesson in course.lessons:
            self.assertTrue(lesson["html"].strip(), lesson["id"])
            self.assertNotIn("<script", lesson["html"].lower(), lesson["id"])
            self.assertGreaterEqual(len(lesson["quiz"]), 3, lesson["id"])
            for question in lesson["quiz"]:
                self.assertGreaterEqual(len(question["options"]), 3, question["question"])
                self.assertIn(question["answer"], range(len(question["options"])), question["question"])
                self.assertTrue(question["explanation"], question["question"])

    def test_answer_positions_vary(self):
        # Steht die richtige Antwort immer an derselben Stelle, lässt sich das Quiz erraten.
        course = content.load_course()
        positions = {question["answer"] for lesson in course.lessons for question in lesson["quiz"]}
        self.assertEqual(positions, {0, 1, 2})

    def test_markdown_escapes_html(self):
        rendered = content.render_markdown("Hallo <script>alert(1)</script> **fett** und `<b>`")
        self.assertNotIn("<script>", rendered)
        self.assertIn("&lt;script&gt;", rendered)
        self.assertIn("<strong>fett</strong>", rendered)
        self.assertIn("<code>&lt;b&gt;</code>", rendered)

    def test_markdown_links_are_restricted(self):
        self.assertNotIn("<a", content.render_markdown("[klick](javascript:alert(1))"))
        external = content.render_markdown("[OWASP](https://owasp.org/)")
        self.assertIn('href="https://owasp.org/"', external)
        self.assertIn('rel="noopener noreferrer"', external)
        self.assertIn('<a href="#/kurs">Kurs</a>', content.render_markdown("[Kurs](#/kurs)"))

    def test_markdown_blocks(self):
        rendered = content.render_markdown(
            "## Titel\n\n- eins\n- zwei\n\n1. erstens\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n"
            "```python\n# kein Titel <x>\n```\n\n> [!TIPP] Ein Hinweis."
        )
        self.assertIn("<h2>Titel</h2>", rendered)
        self.assertIn("<ul><li>eins</li><li>zwei</li></ul>", rendered)
        self.assertIn("<ol><li>erstens</li></ol>", rendered)
        self.assertIn("<th>A</th>", rendered)
        self.assertIn("<td>2</td>", rendered)
        self.assertIn("# kein Titel &lt;x&gt;", rendered)
        self.assertIn('class="callout callout-tipp"', rendered)

    def test_markdown_hard_line_break(self):
        rendered = content.render_markdown("Zeile eins\\\nZeile zwei\ngeht weiter")
        self.assertEqual(rendered, "<p>Zeile eins<br>Zeile zwei geht weiter</p>")

    def test_templates_for_operator_pages(self):
        with tempfile.TemporaryDirectory() as folder:
            for name in content.PAGES:
                shutil.copy(content.CONTENT_DIR / "rechtliches" / f"{name}.beispiel.md", Path(folder) / f"{name}.md")
            pages = content.load_pages(Path(folder))
        self.assertEqual(set(pages), set(content.PAGES))
        for name, page in pages.items():
            self.assertIn("<h2>", page["html"], name)
            self.assertTrue(page["placeholders"], name)  # eine unausgefüllte Vorlage fällt auf
        self.assertIn("[E-MAIL-ADRESSE]", pages["impressum"]["placeholders"])
        self.assertEqual(content.load_pages(Path(folder) / "gibt-es-nicht"), {})

    def test_missions_match_the_filesystem(self):
        terminal = content.load_terminal()
        files = terminal.public["files"]
        for mission in terminal.public["missions"]:
            self.assertNotIn("solution", mission)
        failed = sum("Failed password" in line for line in files["/var/log/auth.log"]["lines"])
        self.assertEqual(terminal.missions["fehlversuche"]["solution"], str(failed))
        world_writable = [
            path for path, meta in files.items()
            if path.startswith("/srv/freigabe/") and meta.get("mode", "rw-r--r--")[7] == "w"
        ]
        self.assertEqual(world_writable, ["/srv/freigabe/" + terminal.missions["rechte"]["solution"]])
        text = "\n".join(line for meta in files.values() for line in meta["lines"])
        for mission_id in ("orientierung", "versteckt", "scope", "inventar", "anmeldung", "sicherungskopie"):
            self.assertIn(terminal.missions[mission_id]["solution"], text, mission_id)


class StaticTests(ServerCase):
    def test_index_has_security_headers(self):
        response, body = self.client().get("/")
        self.assertEqual(response.status, 200)
        self.assertTrue(response.getheader("Content-Type").startswith("text/html"))
        self.assertIn(b"<main", body)
        csp = response.getheader("Content-Security-Policy")
        self.assertIn("script-src 'self'", csp)
        self.assertNotIn("unsafe-inline", csp)
        self.assertEqual(response.getheader("X-Content-Type-Options"), "nosniff")
        self.assertEqual(response.getheader("X-Frame-Options"), "DENY")

    def test_path_traversal_is_blocked(self):
        for path in ("/../server.py", "/%2e%2e/server.py", "/..%5cserver.py", "/js/../../server.py", "/%00"):
            response, _ = self.client().get(path)
            self.assertEqual(response.status, 404, path)

    def test_unknown_paths(self):
        self.assertEqual(self.client().get("/gibt-es-nicht.html")[0].status, 404)
        response, data = self.client().get("/api/gibt-es-nicht")
        self.assertEqual(response.status, 404)
        self.assertIn("error", data)
        self.assertEqual(self.client().post("/api/course")[0].status, 405)

    def test_head_has_no_body(self):
        response, body = self.client().request("HEAD", "/")
        self.assertEqual(response.status, 200)
        self.assertEqual(body, b"")


class AccountTests(ServerCase):
    def test_me_without_login(self):
        response, data = self.client().get("/api/me")
        self.assertEqual(response.status, 200)
        self.assertIsNone(data["user"])
        self.assertEqual(data["stats"]["lessons"], len(self.app.course.lessons))
        self.assertEqual(data["pages"], [])  # ohne hinterlegte Dateien gibt es keine Betreiberseiten

    def test_register_validation(self):
        client = self.client()
        cases = [
            {"username": "ab", "password": PASSWORD, "accept": True},
            {"username": "mit leerzeichen", "password": PASSWORD, "accept": True},
            {"username": "kurzespw", "password": "zu-kurz", "accept": True},
            {"username": "ohnekodex", "password": PASSWORD, "accept": False},
            {"username": "gleichgleich1", "password": "GleichGleich1", "accept": True},
            {"username": 123, "password": PASSWORD, "accept": True},
        ]
        for body in cases:
            response, data = client.post("/api/register", body)
            self.assertEqual(response.status, 400, body)
            self.assertIn("error", data)
        self.assertIsNone(client.cookie)

    def test_duplicate_names_ignore_case(self):
        self.register("Doppelt")
        response, _ = self.client().post("/api/register", {"username": "doppelt", "password": PASSWORD, "accept": True})
        self.assertEqual(response.status, 409)

    def test_session_cookie_flags(self):
        client = self.client()
        response, _ = client.post("/api/register", {"username": "keks", "password": PASSWORD, "accept": True})
        cookie = response.getheader("Set-Cookie")
        self.assertIn("HttpOnly", cookie)
        self.assertIn("SameSite=Strict", cookie)
        self.assertNotIn("Secure", cookie)
        secure = self.client().post(
            "/api/login", {"username": "keks", "password": PASSWORD}, {"X-Forwarded-Proto": "https"}
        )[0].getheader("Set-Cookie")
        self.assertIn("Secure", secure)

    def test_login_and_logout(self):
        self.register("anna")
        client = self.client()
        wrong = client.post("/api/login", {"username": "anna", "password": "falsches-passwort"})
        unknown = client.post("/api/login", {"username": "niemand", "password": "falsches-passwort"})
        self.assertEqual((wrong[0].status, unknown[0].status), (401, 401))
        self.assertEqual(wrong[1]["error"], unknown[1]["error"])  # verrät nicht, ob es das Konto gibt

        response, data = client.post("/api/login", {"username": "ANNA", "password": PASSWORD})
        self.assertEqual(response.status, 200)
        self.assertEqual(data["user"]["name"], "anna")
        self.assertEqual(client.get("/api/me")[1]["user"]["name"], "anna")

        old_cookie = client.cookie
        self.assertEqual(client.post("/api/logout")[0].status, 200)
        self.assertIsNone(client.get("/api/me")[1]["user"])
        client.cookie = old_cookie  # das alte Token darf nach dem Abmelden nicht mehr gelten
        self.assertIsNone(client.get("/api/me")[1]["user"])

    def test_passwords_are_not_stored_in_plain_text(self):
        self.register("hashcheck")
        from backend import db

        conn = db.connect(self.app.db_path)
        try:
            row = conn.execute("SELECT pw_hash, pw_salt FROM users WHERE username = 'hashcheck'").fetchone()
            tokens = [r[0] for r in conn.execute("SELECT token_hash FROM sessions")]
        finally:
            conn.close()
        self.assertNotIn(PASSWORD.encode(), bytes(row["pw_hash"]))
        self.assertEqual(len(row["pw_salt"]), 16)
        self.assertTrue(all(len(token) == 64 for token in tokens))  # SHA-256, nicht das Token selbst

    def test_delete_account(self):
        client = self.register("loeschmich")
        self.assertEqual(self.client().post("/api/account/delete", {"password": PASSWORD})[0].status, 401)
        self.assertEqual(client.post("/api/account/delete", {"password": "falsches-passwort"})[0].status, 403)
        self.assertEqual(client.post("/api/account/delete", {"password": PASSWORD})[0].status, 200)
        self.assertIsNone(client.get("/api/me")[1]["user"])
        self.assertEqual(self.client().post("/api/login", {"username": "loeschmich", "password": PASSWORD})[0].status, 401)


class LearningTests(ServerCase):
    def test_course_and_lesson_hide_answers(self):
        modules = self.client().get("/api/course")[1]["modules"]
        self.assertEqual(len(modules), len(self.app.course.modules))
        lesson_id = modules[0]["lessons"][0]["id"]
        response, lesson = self.client().get(f"/api/lessons/{lesson_id}")
        self.assertEqual(response.status, 200)
        self.assertIn("<p>", lesson["html"])
        self.assertIsNone(lesson["prev"])
        self.assertIsNotNone(lesson["next"])
        for question in lesson["quiz"]:
            self.assertEqual(set(question), {"question", "options"})
        self.assertEqual(self.client().get("/api/lessons/gibt/es-nicht")[0].status, 404)

    def test_quiz_awards_points_once(self):
        client = self.register("quizzer")
        lesson = self.app.course.lessons[0]
        right = self.right_answers(lesson["id"])
        wrong = [(answer + 1) % 3 for answer in right]

        response, data = client.post(f"/api/lessons/{lesson['id']}/quiz", {"answers": wrong})
        self.assertEqual(response.status, 200)
        self.assertFalse(data["passed"])
        self.assertEqual(data["xpAwarded"], 0)
        self.assertNotIn("answer", data["results"][0])

        data = client.post(f"/api/lessons/{lesson['id']}/quiz", {"answers": right})[1]
        self.assertTrue(data["passed"] and data["saved"])
        self.assertEqual(data["xpAwarded"], lesson["xp"])
        self.assertEqual(client.post(f"/api/lessons/{lesson['id']}/quiz", {"answers": right})[1]["xpAwarded"], 0)

        user = client.get("/api/me")[1]["user"]
        self.assertEqual(user["xp"], lesson["xp"])
        self.assertEqual(user["doneLessons"], [lesson["id"]])
        self.assertTrue(next(badge for badge in user["badges"] if badge["id"] == "start")["earned"])

    def test_quiz_as_guest_is_checked_but_not_saved(self):
        lesson = self.app.course.lessons[1]
        data = self.client().post(f"/api/lessons/{lesson['id']}/quiz", {"answers": self.right_answers(lesson["id"])})[1]
        self.assertTrue(data["passed"])
        self.assertFalse(data["saved"])
        self.assertEqual(data["xpAwarded"], 0)

    def test_quiz_rejects_invalid_answers(self):
        lesson = self.app.course.lessons[0]
        count = len(lesson["quiz"])
        for answers in ([], [0] * (count + 1), [99] * count, [True] * count, ["0"] * count, "0", None):
            response, _ = self.client().post(f"/api/lessons/{lesson['id']}/quiz", {"answers": answers})
            self.assertEqual(response.status, 400, answers)

    def test_missions(self):
        client = self.register("terminator")
        terminal = client.get("/api/terminal")[1]
        self.assertNotIn("solution", json.dumps(terminal))
        mission = self.app.terminal.missions["orientierung"]
        self.assertFalse(client.post("/api/missions/orientierung", {"answer": "falsch"})[1]["correct"])
        data = client.post("/api/missions/orientierung", {"answer": "  " + mission["solution"].upper() + " "})[1]
        self.assertTrue(data["correct"])
        self.assertEqual(data["xpAwarded"], mission["xp"])
        self.assertEqual(client.get("/api/me")[1]["user"]["doneMissions"], ["orientierung"])
        self.assertEqual(client.post("/api/missions/gibt-es-nicht", {"answer": "x"})[0].status, 404)
        self.assertEqual(client.post("/api/missions/orientierung", {"answer": ""})[0].status, 400)

    def test_whole_course_earns_certificate_date(self):
        client = self.register("fleissig")
        for lesson in self.app.course.lessons:
            data = client.post(f"/api/lessons/{lesson['id']}/quiz", {"answers": self.right_answers(lesson["id"])})[1]
            self.assertTrue(data["passed"], lesson["id"])
        user = client.get("/api/me")[1]["user"]
        self.assertIsNotNone(user["completedAt"])
        self.assertEqual(user["xp"], sum(lesson["xp"] for lesson in self.app.course.lessons))
        self.assertTrue(next(badge for badge in user["badges"] if badge["id"] == "kurs")["earned"])
        board = client.get("/api/leaderboard")[1]["entries"]
        self.assertEqual(board[0]["name"], "fleissig")

    def test_glossary_is_sorted(self):
        entries = self.client().get("/api/glossary")[1]["entries"]
        self.assertGreater(len(entries), 40)
        self.assertEqual(entries[0]["term"], "Angriffsfläche")


class ProtectionTests(ServerCase):
    def test_foreign_origin_is_rejected(self):
        body = {"username": "x", "password": "y"}
        response, _ = self.client().post("/api/login", body, {"Origin": "http://boese.example"})
        self.assertEqual(response.status, 403)
        own = {"Origin": f"http://127.0.0.1:{self.port}", "Host": f"127.0.0.1:{self.port}"}
        self.assertEqual(self.client().post("/api/login", body, own)[0].status, 401)

    def test_only_json_is_accepted(self):
        client = self.client()
        form = client.request("POST", "/api/login", raw=b"username=x", headers={"Content-Type": "application/x-www-form-urlencoded"})
        self.assertEqual(form[0].status, 415)
        broken = client.request("POST", "/api/login", raw=b"{kaputt", headers={"Content-Type": "application/json"})
        self.assertEqual(broken[0].status, 400)
        array = client.request("POST", "/api/login", raw=b"[1]", headers={"Content-Type": "application/json"})
        self.assertEqual(array[0].status, 400)

    def test_large_bodies_are_rejected(self):
        response, _ = self.client().post("/api/login", {"username": "x" * 20000, "password": "y"})
        self.assertEqual(response.status, 413)

    def test_sql_metacharacters_are_plain_data(self):
        # Parametrisierte Abfragen: Sonderzeichen bleiben Werte und ändern keine Abfrage.
        self.register("echt")
        response, _ = self.client().post("/api/login", {"username": "echt' --", "password": "egal-egal-egal"})
        self.assertEqual(response.status, 401)
        self.assertEqual(self.client().post("/api/login", {"username": "echt", "password": PASSWORD})[0].status, 200)


class RateLimitTests(ServerCase):
    def test_login_attempts_are_limited(self):
        client = self.client()
        limit = self.app.limits["login"].limit
        statuses = [
            client.post("/api/login", {"username": "niemand", "password": "falsches-passwort"})[0].status
            for _ in range(limit + 1)
        ]
        self.assertEqual(statuses, [401] * limit + [429])
        # Ohne Proxy-Modus zählt die echte Verbindung. Ein mitgeschickter Kopf ändert nichts.
        spoofed = client.post("/api/login", {"username": "niemand", "password": "falsches-passwort"}, {"X-Forwarded-For": "203.0.113.9"})
        self.assertEqual(spoofed[0].status, 429)


class ProxyTests(ServerCase):
    """Hinter einem Reverse Proxy kommt jede Verbindung von 127.0.0.1. Gezählt wird dann die weitergereichte Adresse."""

    behind_proxy = True

    def attempt(self, forwarded):
        body = {"username": "niemand", "password": "falsches-passwort"}
        return self.client().post("/api/login", body, {"X-Forwarded-For": forwarded})[0].status

    def test_limit_counts_per_forwarded_address(self):
        limit = self.app.limits["login"].limit
        statuses = [self.attempt("203.0.113.5") for _ in range(limit + 1)]
        self.assertEqual(statuses, [401] * limit + [429])
        self.assertEqual(self.attempt("203.0.113.6"), 401)  # andere Adresse, eigenes Kontingent

    def test_client_cannot_pick_its_own_address(self):
        limit = self.app.limits["login"].limit
        for _ in range(limit):
            self.attempt("198.51.100.20")
        # Der Proxy hängt die echte Adresse hinten an. Vorangestellte Werte stammen vom Client.
        self.assertEqual(self.attempt("10.1.2.3, 198.51.100.20"), 429)


class PageTests(ServerCase):
    """Impressum und Datenschutzerklärung kommen aus Dateien des Betreibers neben der Datenbank."""

    pages = {
        "impressum": "## Angaben\n\nErika Beispiel\\\nMusterweg 1\\\n12345 Musterstadt\n\n"
        "E-Mail: [E-MAIL-ADRESSE] <script>alert(1)</script>\n"
    }

    def test_existing_page_is_served(self):
        self.assertEqual(self.client().get("/api/me")[1]["pages"], ["impressum"])
        response, page = self.client().get("/api/pages/impressum")
        self.assertEqual(response.status, 200)
        self.assertEqual(page["title"], "Impressum")
        self.assertIn("Erika Beispiel<br>Musterweg 1<br>12345 Musterstadt", page["html"])
        self.assertNotIn("<script>", page["html"])

    def test_missing_and_unknown_pages(self):
        self.assertEqual(self.client().get("/api/pages/datenschutz")[0].status, 404)
        self.assertEqual(self.client().get("/api/pages/gibt-es-nicht")[0].status, 404)

    def test_notes_at_start(self):
        public = self.app.page_notes(public=True)
        self.assertEqual(len(public), 2)
        self.assertIn("[E-MAIL-ADRESSE]", public[0])  # offener Platzhalter im Impressum
        self.assertIn("datenschutz.md", public[1])  # fehlende Datenschutzerklärung
        self.assertEqual(len(self.app.page_notes(public=False)), 1)  # lokal stört eine fehlende Seite nicht


class StaticBuildTests(unittest.TestCase):
    """Die statische Ausgabe (statisch.py) ersetzt den Server durch daten.json und public/js/statisch.js."""

    @classmethod
    def setUpClass(cls):
        cls.tmp = Path(tempfile.mkdtemp(prefix="einfallstor-statisch-"))
        pages = cls.tmp / "seiten"
        pages.mkdir()
        rechtliches = content.CONTENT_DIR / "rechtliches"
        shutil.copy(rechtliches / "impressum.beispiel.md", pages / "impressum.md")
        shutil.copy(rechtliches / "datenschutz-statisch.beispiel.md", pages / "datenschutz.md")
        cls.target = cls.tmp / "dist"
        cls.result = statisch.build(cls.target, pages)
        cls.data = json.loads((cls.target / "daten.json").read_text(encoding="utf-8"))

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def test_data_matches_the_api(self):
        course, terminal = content.load_course(), content.load_terminal()
        self.assertEqual(self.data["stats"], api.course_stats(course, terminal))
        self.assertEqual(self.data["course"], course.outline)
        self.assertEqual(set(self.data["lessons"]), set(course.by_id))
        self.assertEqual(self.data["levels"], [list(level) for level in api.LEVELS])
        self.assertEqual(len(self.data["glossary"]), len(content.load_glossary()))
        for lesson in self.data["lessons"].values():
            for question in lesson["quiz"]:  # ohne Server prüft der Browser, er braucht Lösung und Erklärung
                self.assertIn(question["answer"], range(len(question["options"])))
                self.assertTrue(question["explanation"])

    def test_missions_carry_a_checksum_instead_of_the_solution(self):
        solutions = content.load_terminal().missions
        self.assertEqual(len(self.data["terminal"]["missions"]), len(solutions))
        for mission in self.data["terminal"]["missions"]:
            self.assertNotIn("solution", mission)
            solution = solutions[mission["id"]]["solution"]
            # statisch.js vereinheitlicht mit toLowerCase. Bei reinem ASCII ergibt das dasselbe wie casefold.
            self.assertTrue(solution.isascii(), mission["id"])
            expected = hashlib.sha256(" ".join(solution.split()).lower().encode()).hexdigest()
            self.assertEqual(mission["hash"], expected, mission["id"])
        raw = (self.target / "daten.json").read_text(encoding="utf-8")
        self.assertNotIn('"solution"', raw)

    def test_index_runs_without_a_server(self):
        html = (self.target / "index.html").read_text(encoding="utf-8")
        self.assertIn('<meta name="einfallstor-modus" content="statisch">', html)
        # Pages sendet keine eigenen Kopfzeilen: Die Richtlinie steht in der Seite, verbietet alles und erlaubt nur Eigenes.
        self.assertIn("Content-Security-Policy", html)
        self.assertIn("default-src 'none'", html)
        self.assertIn("script-src 'self'", html)
        self.assertIn("form-action 'none'", html)
        self.assertNotIn("unsafe", html)
        self.assertIn('<meta name="referrer" content="no-referrer">', html)
        # GitHub Pages liegt in einem Unterordner: Pfade, die mit / beginnen, zeigen dort ins Leere.
        self.assertNotRegex(html, r'(?:href|src)="/')
        self.assertTrue((self.target / "js" / "statisch.js").is_file())
        source = (statisch.PUBLIC_DIR / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("einfallstor-modus", source)  # die Fassung mit Server bleibt unverändert

    def test_operator_pages_are_included(self):
        self.assertEqual(set(self.data["pages"]), set(content.PAGES))
        self.assertIn("GitHub Pages", self.data["pages"]["datenschutz"]["html"])
        self.assertNotIn("placeholders", self.data)
        self.assertIn("[DATUM]", self.result["placeholders"]["datenschutz"])  # unausgefüllte Vorlage fällt auf
        self.assertEqual(statisch.collect()["pages"], {})  # ohne Ordner gibt es keine Betreiberseiten


class UnitTests(unittest.TestCase):
    def test_levels(self):
        self.assertEqual(api._level(0)["title"], "Neuling")
        self.assertEqual(api._level(99)["number"], 1)
        self.assertEqual(api._level(100)["number"], 2)
        self.assertIsNone(api._level(5000)["next"])

    def test_slugify(self):
        self.assertEqual(content.slugify("Die Shell: erste Schritte"), "die-shell-erste-schritte")
        self.assertEqual(content.slugify("Passwörter & Größe"), "passwoerter-groesse")


if __name__ == "__main__":
    unittest.main()
