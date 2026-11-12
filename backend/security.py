"""Passwörter, Sitzungen und Begrenzung von Anfragen."""
from __future__ import annotations

import hashlib
import hmac
import secrets
import threading
import time
from collections import deque

# scrypt ist absichtlich rechen- und speicheraufwendig. Diese Parameter
# brauchen rund 16 MB Arbeitsspeicher pro Berechnung.
_SCRYPT = {"n": 2**14, "r": 8, "p": 1, "dklen": 32}


def hash_password(password: str, salt: bytes | None = None) -> tuple[bytes, bytes]:
    """Gibt (Hash, Salt) zurück. Ohne Salt wird ein neuer Zufallswert erzeugt."""
    salt = salt or secrets.token_bytes(16)
    return hashlib.scrypt(password.encode("utf-8"), salt=salt, **_SCRYPT), salt


def verify_password(password: str, digest: bytes, salt: bytes) -> bool:
    candidate, _ = hash_password(password, salt)
    return hmac.compare_digest(candidate, digest)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def new_session_token() -> tuple[str, str]:
    """Gibt (Token für das Cookie, Hash für die Datenbank) zurück."""
    token = secrets.token_urlsafe(32)
    return token, hash_token(token)


def session_cookie(token: str, max_age: int, secure: bool) -> str:
    parts = [f"sid={token}", "Path=/", "HttpOnly", "SameSite=Strict", f"Max-Age={max_age}"]
    if secure:
        parts.append("Secure")
    return "; ".join(parts)


class RateLimiter:
    """Erlaubt je Schlüssel höchstens `limit` Treffer innerhalb von `window` Sekunden."""

    def __init__(self, limit: int, window: float):
        self.limit = limit
        self.window = window
        self._hits: dict[str, deque] = {}
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            hits = self._hits.setdefault(key, deque())
            while hits and now - hits[0] > self.window:
                hits.popleft()
            if len(hits) >= self.limit:
                return False
            hits.append(now)
            if len(self._hits) > 5000:
                self._drop_idle(now)
            return True

    def _drop_idle(self, now: float) -> None:
        idle = [key for key, hits in self._hits.items() if not hits or now - hits[-1] > self.window]
        for key in idle:
            del self._hits[key]
