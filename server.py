#!/usr/bin/env python3
"""Einfallstor: Lernplattform für Pentesting-Einsteiger.

Start:  python server.py            (http://127.0.0.1:1337)
        python server.py --open     (öffnet zusätzlich den Browser)

Der Server braucht nur die Python-Standardbibliothek.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import threading
import time
import traceback
import webbrowser
from contextlib import closing
from http.cookies import CookieError, SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

from backend import api, content, db, security

ROOT = Path(__file__).resolve().parent
PUBLIC_DIR = (ROOT / "public").resolve()
MAX_BODY = 8 * 1024


def _public_files() -> dict[str, Path]:
    """Alle Dateien, die der Server ausliefert: Adresse relativ zu public/ -> Datei.

    Der Pfad einer Anfrage dient nur als Schlüssel in dieser Liste und berührt das
    Dateisystem nie. Damit scheitern Path Traversal und alle Tricks mit Laufwerken,
    Netzwerkpfaden und Gerätenamen an derselben Stelle. Wichtig ist das vor allem
    unter Windows: Dort baut schon das Auflösen eines Pfads wie \\\\rechner\\freigabe
    eine Verbindung zu einem fremden Rechner auf, noch bevor eine Prüfung ihn ablehnt.

    Die Liste entsteht beim Start. Neue Dateien in public/ erkennt der Server nach
    einem Neustart. Verknüpfungen, die aus public/ herausführen, bleiben draußen.
    """
    files = {}
    for path in PUBLIC_DIR.rglob("*"):
        if path.is_file() and path.resolve().is_relative_to(PUBLIC_DIR):
            files[path.relative_to(PUBLIC_DIR).as_posix()] = path
    return files


PUBLIC_FILES = _public_files()

MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8",
}

# Diese Kopfzeilen gehen mit jeder Antwort hinaus. Die Content Security Policy
# erlaubt Skripte und Stile nur aus dem eigenen Ursprung, also weder
# eingebettete Skripte noch fremde Quellen.
SECURITY_HEADERS = {
    "Content-Security-Policy": (
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; "
        "connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; "
        "frame-ancestors 'none'"
    ),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}


class Handler(BaseHTTPRequestHandler):
    server_version = "Einfallstor"
    sys_version = ""
    timeout = 20

    def _client_ip(self) -> str:
        """Adresse des Clients, wichtig für die Begrenzung der Anmeldeversuche."""
        headers = getattr(self, "headers", None)  # fehlt, wenn schon die erste Zeile der Anfrage kaputt war
        if self.server.behind_proxy and headers is not None:
            # Der eigene Proxy hängt die Adresse des Clients hinten an X-Forwarded-For an.
            # Alles davor kann der Client selbst geschickt haben und zählt deshalb nicht.
            forwarded = headers.get("X-Forwarded-For", "")
            last = forwarded.rsplit(",", 1)[-1].strip()
            if last:
                return last
        return self.client_address[0]

    def address_string(self) -> str:
        return self._client_ip()  # damit im Zugriffsprotokoll nicht nur der Proxy steht

    # --- Antworten ---

    def _send(self, status: int, body: bytes, content_type: str, headers: dict | None = None) -> None:
        self.send_response(status)
        for name, value in SECURITY_HEADERS.items():
            self.send_header(name, value)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        if self.command != "HEAD" and body:
            self.wfile.write(body)

    def _send_json(self, status: int, payload: dict, cookie: str | None = None) -> None:
        headers = {"Cache-Control": "no-store"}
        if cookie:
            headers["Set-Cookie"] = cookie
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self._send(status, body, MIME[".json"], headers)

    # --- Eingang ---

    def _handle(self) -> None:
        path = unquote(urlsplit(self.path).path)
        try:
            # Den Körper immer zuerst abholen. Bliebe er ungelesen im Puffer,
            # könnte die Antwort beim Schließen der Verbindung verloren gehen.
            raw = self._read_raw() if self.command == "POST" else b""
            if path.startswith("/api/"):
                self._handle_api(path, raw)
            elif self.command in ("GET", "HEAD"):
                self._handle_static(path)
            else:
                self._send_json(405, {"error": "Methode nicht erlaubt."})
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception:
            traceback.print_exc()
            self._send_json(500, {"error": "Interner Fehler."})

    do_GET = do_HEAD = do_POST = _handle

    def _handle_static(self, path: str) -> None:
        # Nur nachschlagen, nie einen Pfad aus der Anfrage zusammensetzen (siehe _public_files).
        target = PUBLIC_FILES.get("index.html" if path == "/" else path.lstrip("/"))
        if target is None or not target.is_file():
            self._send(404, "Nicht gefunden".encode("utf-8"), MIME[".txt"])
            return
        stat = target.stat()
        etag = f'"{stat.st_mtime_ns:x}-{stat.st_size:x}"'
        headers = {"ETag": etag, "Cache-Control": "no-cache"}
        content_type = MIME.get(target.suffix.lower(), "application/octet-stream")
        if self.headers.get("If-None-Match") == etag:
            self._send(304, b"", content_type, headers)
        else:
            self._send(200, target.read_bytes(), content_type, headers)

    def _read_raw(self) -> bytes | None:
        """Liest den Anfragekörper. None heißt: zu groß oder Längenangabe unbrauchbar."""
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            return None
        if length < 0:
            return None
        if length > MAX_BODY:
            self.rfile.read(min(length, 1024 * 1024))  # verwerfen statt auswerten
            return None
        return self.rfile.read(length) if length else b""

    def _parse_body(self, raw: bytes | None) -> dict:
        if raw is None:
            raise api.ApiError(413, "Die Anfrage ist zu groß.")
        # Schutz vor Cross-Site Request Forgery, zusätzlich zum SameSite-Cookie:
        # Schreibende Anfragen müssen vom eigenen Ursprung kommen und JSON sein.
        origin = self.headers.get("Origin")
        if origin and urlsplit(origin).netloc != self.headers.get("Host", ""):
            raise api.ApiError(403, "Anfrage von fremder Seite abgelehnt.")
        if not self.headers.get("Content-Type", "").lower().startswith("application/json"):
            raise api.ApiError(415, "Erwartet wird JSON.")
        try:
            body = json.loads(raw or b"{}")
        except ValueError:
            raise api.ApiError(400, "Ungültiges JSON.") from None
        if not isinstance(body, dict):
            raise api.ApiError(400, "Ungültiges JSON.")
        return body

    def _session(self, conn) -> tuple:
        try:
            morsel = SimpleCookie(self.headers.get("Cookie", "")).get("sid")
        except CookieError:
            morsel = None
        if morsel is None or not morsel.value:
            return None, None
        token_hash = security.hash_token(morsel.value)
        user = conn.execute(
            "SELECT u.id, u.username, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id "
            "WHERE s.token_hash = ? AND s.expires_at > ?",
            (token_hash, int(time.time())),
        ).fetchone()
        return user, token_hash

    def _handle_api(self, path: str, raw: bytes | None) -> None:
        app = self.server.app
        handler, params, known_path = None, (), False
        for method, pattern, function in api.ROUTES:
            match = pattern.fullmatch(path)
            if match:
                known_path = True
                if method == self.command:
                    handler, params = function, match.groups()
                    break
        if handler is None:
            if known_path:
                self._send_json(405, {"error": "Methode nicht erlaubt."})
            else:
                self._send_json(404, {"error": "Diesen Endpunkt gibt es nicht."})
            return

        cookie = None
        with closing(db.connect(app.db_path)) as conn:
            try:
                body = self._parse_body(raw) if self.command == "POST" else {}
                user, token_hash = self._session(conn)
                request = api.Request(
                    app=app,
                    conn=conn,
                    ip=self._client_ip(),
                    body=body,
                    params=params,
                    user=user,
                    token_hash=token_hash,
                    # Hinter einem HTTPS-Proxy bekommt das Cookie das Kennzeichen Secure.
                    secure=self.headers.get("X-Forwarded-Proto", "").lower() == "https",
                )
                status, payload = handler(request)
                conn.commit()
                cookie = request.cookie
            except api.ApiError as error:
                conn.rollback()
                status, payload = error.status, {"error": error.message}
        self._send_json(status, payload, cookie)


class Server(ThreadingHTTPServer):
    daemon_threads = True
    # Unter Windows dürften mit SO_REUSEADDR zwei Programme denselben Port belegen.
    # Dort bleibt die Option deshalb aus, damit ein zweiter Start sauber scheitert.
    allow_reuse_address = os.name != "nt"


def create_server(host: str, port: int, db_path: str, behind_proxy: bool = False) -> Server:
    app = api.App(db_path)
    server = Server((host, port), Handler)
    server.app = app
    # Nur einschalten, wenn wirklich ein eigener Proxy davorsteht. Sonst könnte
    # jeder Client seine Adresse über X-Forwarded-For frei wählen.
    server.behind_proxy = behind_proxy
    return server


def main() -> None:
    parser = argparse.ArgumentParser(description="Einfallstor: Lernplattform für Pentesting-Einsteiger")
    parser.add_argument("--host", default=os.environ.get("HOST", "127.0.0.1"), help="Adresse, Standard 127.0.0.1")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "1337")), help="Port, Standard 1337")
    parser.add_argument("--db", default=str(ROOT / "data" / "einfallstor.db"), help="Pfad der SQLite-Datei")
    parser.add_argument("--open", action="store_true", help="Browser nach dem Start öffnen")
    parser.add_argument(
        "--behind-proxy",
        action="store_true",
        help="Client-Adresse aus X-Forwarded-For lesen (nur hinter einem eigenen Reverse Proxy)",
    )
    args = parser.parse_args()

    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(errors="replace")

    Path(args.db).parent.mkdir(parents=True, exist_ok=True)
    try:
        server = create_server(args.host, args.port, args.db, args.behind_proxy)
    except content.ContentError as error:
        sys.exit(f"Fehler in den Kursinhalten: {error}")
    except OSError as error:
        sys.exit(f"Der Server konnte nicht starten ({error}).\nLäuft Einfallstor schon? Sonst mit --port einen anderen Port wählen.")
    url = f"http://{'localhost' if args.host in ('127.0.0.1', '0.0.0.0') else args.host}:{args.port}"
    stats = server.app.stats
    print(f"Einfallstor läuft auf {url}")
    print(f"{stats['modules']} Module, {stats['lessons']} Lektionen, {stats['questions']} Quizfragen, {stats['missions']} Missionen")
    for note in server.app.page_notes(public=args.behind_proxy):
        print(f"Hinweis: {note}")
    print("Beenden mit Strg+C", flush=True)  # flush, damit die Zeilen auch im Journal des Servers sofort stehen
    if args.open:
        threading.Timer(0.6, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nBeendet.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
