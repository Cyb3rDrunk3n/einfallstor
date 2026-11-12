"""SQLite-Datenbank: Schema und Verbindungsaufbau.

Alle Abfragen im Projekt verwenden Platzhalter (?). Werte werden nie in den
SQL-Text eingebaut, deshalb ist SQL-Injection hier ausgeschlossen.
"""
from __future__ import annotations

import sqlite3
from contextlib import closing

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY,
    username   TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    pw_hash    BLOB    NOT NULL,
    pw_salt    BLOB    NOT NULL,
    created_at INTEGER NOT NULL
);

-- Gespeichert wird nur der SHA-256-Wert des Sitzungstokens. Wer die Datenbank
-- liest, kann damit keine fremde Sitzung übernehmen.
CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS progress (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind    TEXT    NOT NULL CHECK (kind IN ('lesson', 'mission')),
    item_id TEXT    NOT NULL,
    xp      INTEGER NOT NULL,
    done_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, kind, item_id)
);
"""


def connect(path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(path, timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init(path: str) -> None:
    with closing(connect(path)) as conn:
        conn.execute("PRAGMA journal_mode = WAL")
        conn.executescript(SCHEMA)
        conn.commit()
