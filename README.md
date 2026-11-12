# Einfallstor

Pentesting lernen von null: eine Lernplattform für absolute Einsteiger mit Kurs, Quiz und Übungsterminal im Browser.

Das Backend ist reines Python ohne Abhängigkeiten, das Frontend kommt ohne Framework und ohne Build-Schritt aus. Klonen, starten, lernen.

![Startseite von Einfallstor](docs/startseite.jpg)

## Was drin ist

- **Kurs für Einsteiger:** 8 Module mit 22 Lektionen zu Recht und Ethik, Netzwerken, Linux, Methodik, Web-Sicherheit, Passwörtern, Schwachstellen und Berichtswesen. Jeder Fachbegriff wird beim ersten Auftreten erklärt.
- **Quiz zu jeder Lektion:** 83 Fragen. Ausgewertet wird auf dem Server, die Lösungen verlassen ihn nie.
- **Übungsterminal:** eine simulierte Linux-Shell im Browser mit Dateisystem, Rechten, Pipes und Tab-Vervollständigung. Acht Missionen üben das Handwerk. Dahinter steckt kein echtes System und kein Netzwerk.
- **Werkzeugkasten:** Kodierer, Hash-Rechner, Subnetzrechner, Passwort-Check, Port-Lexikon und HTTP-Statuscodes. Alles rechnet im Browser.
- **Konto, Punkte, Rangliste:** Fortschritt, Ränge, Abzeichen und am Ende eine Teilnahmebescheinigung zum Ausdrucken. Ein Konto braucht nur Name und Passwort, keine E-Mail-Adresse.
- **Glossar** mit 57 Fachbegriffen und Suche.
- **Keine Tracker, keine externen Anfragen:** Schriften, Skripte und Stile kommen vom eigenen Server.

Der Kurs erklärt, wie Systeme funktionieren, wo ihre typischen Schwächen liegen und wie man sie absichert. Praktische Angriffsübungen gehören in dafür gebaute Übungsumgebungen, auf die der Kurs verweist.

## Schnellstart

Voraussetzung ist Python 3.10 oder neuer. Weitere Pakete werden nicht gebraucht.

```bash
git clone https://github.com/cyb3rdrunk3n/einfallstor.git
```

```bash
cd einfallstor
```

```bash
python server.py --open
```

Die Seite läuft danach unter http://localhost:1337. Unter Windows genügt ein Doppelklick auf `start.bat`.

| Option | Wirkung | Standard |
|---|---|---|
| `--port` | Port des Servers | 1337 |
| `--host` | Adresse, auf der der Server lauscht | 127.0.0.1 |
| `--db` | Pfad der SQLite-Datei | `data/einfallstor.db` |
| `--open` | öffnet nach dem Start den Browser | aus |
| `--behind-proxy` | liest die Adresse des Clients aus `X-Forwarded-For`, nur für den Betrieb hinter einem eigenen Reverse Proxy | aus |

## Der Kurs

| Modul | Inhalt |
|---|---|
| 1. Einstieg und Recht | Was ein Pentest ist, Rechtslage in Deutschland, legales Übungslabor |
| 2. Netzwerk-Grundlagen | IP-Adressen, Subnetze, Ports, TCP und UDP, DNS und HTTP |
| 3. Linux-Grundlagen | Shell, Benutzer und Rechte, Suchen und Filtern |
| 4. Methodik | Phasen eines Pentests, Informationsbeschaffung, Scannen und Enumerieren |
| 5. Web-Sicherheit verstehen | Aufbau von Webanwendungen, Injection, Cross-Site-Scripting, Zugriffskontrolle |
| 6. Passwörter und Kryptografie | Kodieren, hashen, verschlüsseln, Passwortstärke |
| 7. Schwachstellen und Härtung | CVE, CVSS, Patches, Rechteausweitung, Härtung |
| 8. Bericht und Ausblick | Aufbau eines Berichts, Lernplan für danach |

## Aufbau des Projekts

```
einfallstor/
├── server.py            HTTP-Server, Auslieferung der Dateien, Sicherheits-Header
├── backend/
│   ├── api.py           alle Endpunkte und die Routentabelle
│   ├── content.py       lädt Kurs, Terminal und Glossar, rendert Markdown
│   ├── db.py            SQLite-Schema
│   └── security.py      Passwort-Hashing, Sitzungen, Begrenzung von Anfragen
├── content/
│   ├── kurs/            ein Markdown-Dokument je Modul
│   ├── terminal.json    Dateisystem und Missionen des Übungsterminals
│   └── glossar.json
├── public/              Frontend: index.html, CSS, JavaScript-Module
├── deploy/              Einrichtungspaket für einen öffentlichen Server
├── tests/               Tests für Inhalte und API
└── start.bat            Starter für Windows
```

## Inhalte ergänzen

Jedes Modul ist eine Markdown-Datei in `content/kurs/`. Der Dateiname legt die Reihenfolge fest. Eine Lektion beginnt mit einer Überschrift erster Ebene, das Quiz steht am Ende:

```markdown
---
titel: Mein Modul
kurz: Ein Satz, der das Modul beschreibt.
icon: book
---

# Titel der Lektion
minuten: 8
xp: 40

Text in Markdown: Absätze, Listen, Tabellen, Codeblöcke und Hinweiskästen.

> [!TIPP] Ein Hinweiskasten. Es gibt TIPP, MERKE, RECHT, ABWEHR und PRAXIS.

?? Die Frage
( ) eine falsche Antwort
(x) die richtige Antwort
( ) noch eine falsche Antwort
!! Die Erklärung, die nach dem Antworten erscheint.
```

Nach einer Änderung den Server neu starten. Formfehler meldet er beim Start, die Tests prüfen den Kurs zusätzlich auf Vollständigkeit.

## Tests

```bash
python -m unittest discover -s tests -v
```

Die Tests starten für jede Testklasse einen eigenen Server mit leerer Datenbank und prüfen Inhalte, Anmeldung, Quiz, Missionen und die Schutzmaßnahmen.

## Sicherheit

Die Plattform setzt um, was der Kurs lehrt. Die Seite „Sicherheitskonzept“ in der Anwendung beschreibt jede Maßnahme und nennt die passende Lektion.

- Passwörter werden mit scrypt und eigenem Salt pro Konto gespeichert.
- Das Sitzungstoken liegt nur als SHA-256-Wert in der Datenbank. Das Cookie trägt `HttpOnly` und `SameSite=Strict`, hinter HTTPS zusätzlich `Secure`.
- Alle Datenbankabfragen sind parametrisiert.
- Eine Content Security Policy erlaubt Skripte und Stile nur vom eigenen Ursprung, ohne `unsafe-inline`.
- Schreibende Anfragen müssen JSON sein und vom eigenen Ursprung stammen.
- Anmeldeversuche sind begrenzt, die Fehlermeldung verrät nicht, ob ein Konto existiert.
- Quizlösungen und Lösungswörter bleiben auf dem Server.

Der eingebaute Server ist für den Betrieb auf dem eigenen Rechner gedacht und lauscht deshalb nur auf 127.0.0.1. Wer die Plattform für andere anbietet, stellt einen Reverse Proxy mit HTTPS davor und startet den Server mit `--behind-proxy`, damit die Begrenzung der Anmeldeversuche die Adresse des Besuchers zählt und nicht die des Proxys. Die Begrenzung lebt im Arbeitsspeicher und beginnt nach einem Neustart von vorn.

## Öffentlich betreiben

Im Ordner [deploy](deploy/README.md) liegt ein Einrichtungspaket für einen Debian-Server: Firewall, SSH nur mit Schlüssel, automatische Updates, ein abgeschotteter systemd-Dienst und Caddy als HTTPS-Proxy. Das Paket ist in einer virtuellen Maschine mit Debian 13 getestet. Der Betrieb mit einer echten Domain und einem Zertifikat von Let's Encrypt ist noch nicht erprobt.

Eine Sicherheitslücke gefunden? Bitte als Issue melden oder über die Funktion „Report a vulnerability“ des Repositorys.

## Rechtlicher Hinweis

Das Projekt dient der Ausbildung. Teste nur Systeme, die dir gehören oder für die du eine schriftliche Erlaubnis hast. Wer ohne Erlaubnis in fremde Systeme eindringt, macht sich strafbar, in Deutschland unter anderem nach § 202a StGB. Die Lektion „Recht und Ethik“ gibt einen Überblick und ersetzt keine Rechtsberatung.

## Lizenz

MIT, siehe [LICENSE](LICENSE).
