# Sicherheit

## Eine Schwachstelle melden

Bitte melde Sicherheitslücken nicht als öffentliches Issue. Nutze die Funktion „Report a vulnerability“ im Reiter Security dieses Repositorys, die Meldung bleibt dann vertraulich. Beschreibe, was du gefunden hast und wie es sich nachstellen lässt.

## Was dazugehört

- der Server (`server.py`, `backend/`)
- das Frontend (`public/`) und die statische Ausgabe (`statisch.py`)
- das Einrichtungspaket (`deploy/`) und die Abläufe unter `.github/workflows/`

Gepflegt wird der Stand des Zweigs `main`.

## Was nicht dazugehört

- Das Übungsterminal ist eine Simulation ohne echtes System und ohne Netzwerk.
- In der statischen Ausgabe prüft der Browser das Quiz. Dass sich die Lösungen dort in `daten.json` nachlesen lassen, ist bekannt und im README beschrieben.

## Regeln für Tests

Teste nur deine eigene Kopie der Plattform. Tests gegen fremde Installationen brauchen die Erlaubnis ihres Betreibers.
