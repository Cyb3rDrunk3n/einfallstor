# Einfallstor

Pentesting lernen von null: eine Lernplattform für absolute Einsteiger mit Kurs, Quiz und Übungsterminal im Browser.

Das Backend ist reines Python ohne Abhängigkeiten, das Frontend kommt ohne Framework und ohne Build-Schritt aus. Klonen, starten, lernen.

**Direkt ausprobieren:** https://cyb3rdrunk3n.github.io/einfallstor/ (statische Ausgabe ohne Konten, der Fortschritt bleibt im Browser)

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
├── statisch.py          baut die statische Ausgabe, zum Beispiel für GitHub Pages
├── backend/
│   ├── api.py           alle Endpunkte und die Routentabelle
│   ├── content.py       lädt Kurs, Terminal und Glossar, rendert Markdown
│   ├── db.py            SQLite-Schema
│   └── security.py      Passwort-Hashing, Sitzungen, Begrenzung von Anfragen
├── content/
│   ├── kurs/            ein Markdown-Dokument je Modul
│   ├── rechtliches/     Vorlagen für Impressum und Datenschutzerklärung
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

Die Tests starten für jede Testklasse einen eigenen Server mit leerer Datenbank und prüfen Inhalte, Anmeldung, Quiz, Missionen, die Schutzmaßnahmen und die statische Ausgabe.

## Sicherheit

Die Plattform setzt um, was der Kurs lehrt. Die Seite „Sicherheitskonzept“ in der Anwendung beschreibt jede Maßnahme und nennt die passende Lektion.

- Passwörter werden mit scrypt und eigenem Salt pro Konto gespeichert.
- Das Sitzungstoken liegt nur als SHA-256-Wert in der Datenbank. Das Cookie trägt `HttpOnly` und `SameSite=Strict`, hinter HTTPS zusätzlich `Secure`.
- Alle Datenbankabfragen sind parametrisiert.
- Eine Content Security Policy erlaubt Skripte und Stile nur vom eigenen Ursprung, ohne `unsafe-inline`.
- Schreibende Anfragen müssen JSON sein und vom eigenen Ursprung stammen.
- Anmeldeversuche sind begrenzt, die Fehlermeldung verrät nicht, ob ein Konto existiert.
- Quizlösungen und Lösungswörter bleiben auf dem Server.
- Ausgeliefert werden nur Dateien, die beim Start im Ordner `public` lagen. Der Pfad einer Anfrage dient nur zum Nachschlagen in dieser Liste und berührt das Dateisystem nie.

Der eingebaute Server ist für den Betrieb auf dem eigenen Rechner gedacht und lauscht deshalb nur auf 127.0.0.1. Wer die Plattform für andere anbietet, stellt einen Reverse Proxy mit HTTPS davor und startet den Server mit `--behind-proxy`, damit die Begrenzung der Anmeldeversuche die Adresse des Besuchers zählt und nicht die des Proxys. Die Begrenzung lebt im Arbeitsspeicher und beginnt nach einem Neustart von vorn.

## Impressum und Datenschutzerklärung

Wer die Plattform öffentlich betreibt, braucht in Deutschland in aller Regel ein Impressum und eine Datenschutzerklärung. Beide Seiten gehören zum Betreiber und nicht ins Repository. Der Server liest sie deshalb aus dem Ordner `seiten` neben der Datenbank:

| Datei | Seite |
|---|---|
| `data/seiten/impressum.md` | Impressum |
| `data/seiten/datenschutz.md` | Datenschutzerklärung |

Vorlagen liegen in `content/rechtliches/`. Kopiere sie an die genannten Stellen, ersetze die Platzhalter in eckigen Klammern und starte den Server neu. Danach erscheinen die Links in der Fußzeile, und das Formular zum Anlegen eines Kontos verweist auf die Datenschutzerklärung. Solange Platzhalter übrig sind, meldet der Server das beim Start.

Die Vorlage zur Datenschutzerklärung beschreibt, was die Anwendung verarbeitet: Serverprotokoll, Konto, Rangliste und das Sitzungs-Cookie. Die Angaben zum Hosting, zur Aufbewahrung der Protokolle und zur Aufsichtsbehörde müssen zum eigenen Betrieb passen. Für die statische Ausgabe gibt es eine eigene Vorlage, `datenschutz-statisch.beispiel.md`. Sie beschreibt GitHub Pages als Hosting und den Speicher des Browsers. Die Vorlagen sind ein Ausgangspunkt und keine Rechtsberatung.

## Öffentlich betreiben

Im Ordner [deploy](deploy/README.md) liegt ein Einrichtungspaket für einen Debian-Server: Firewall, SSH nur mit Schlüssel, automatische Updates, ein abgeschotteter systemd-Dienst und Caddy als HTTPS-Proxy. Das Paket ist in einer virtuellen Maschine mit Debian 13 getestet. Der Betrieb mit einer echten Domain und einem Zertifikat von Let's Encrypt ist noch nicht erprobt.

Eine Sicherheitslücke gefunden? Bitte vertraulich über die Funktion „Report a vulnerability“ des Repositorys melden, Näheres steht in [SECURITY.md](SECURITY.md).

Die Abläufe unter `.github/workflows/` legen jede Aktion auf einen festen Commit und arbeiten mit einem Zugriffstoken, das nur lesen darf. Dependabot schlägt neuere Stände der Aktionen als Pull Request vor.

## Statische Ausgabe für GitHub Pages

Für eine Webseite ohne eigenen Server gibt es eine statische Ausgabe. Kurs, Quiz, Übungsterminal, Werkzeuge und Glossar laufen dabei vollständig im Browser. Der Fortschritt liegt im Speicher des Browsers (`localStorage`).

```bash
python statisch.py
```

Das Ergebnis steht im Ordner `dist` und lässt sich bei jedem Anbieter für statische Seiten ablegen. Zum Ansehen auf dem eigenen Rechner:

```bash
python -m http.server 8000 --directory dist
```

| Option | Wirkung | Standard |
|---|---|---|
| `--ziel` | Zielordner | `dist` |
| `--seiten` | Ordner mit `impressum.md` und `datenschutz.md` des Betreibers | ohne Betreiberseiten |

Was der statischen Ausgabe fehlt:

- Es gibt keine Konten und keine Rangliste. Der Fortschritt bleibt in dem Browser, in dem er entstanden ist.
- Der Browser prüft das Quiz selbst. Die Lösungen stehen deshalb in der Datei `daten.json` und lassen sich dort nachlesen. Von den Missionen stehen dort nur die Prüfsummen der Lösungswörter.
- GitHub Pages sendet keine eigenen Sicherheits-Header. Die Content Security Policy steht deshalb als `meta`-Element in der Seite. Sie verbietet alles und erlaubt nur eigene Skripte, Stile, Bilder und das Laden der Kursdaten. Header wie `X-Frame-Options` entfallen. Als Ersatz prüft die Anwendung beim Start, ob sie in einem Frame läuft, und startet dann nicht.

Der Fortschritt im Speicher des Browsers gilt als fremde Eingabe: Beim Lesen übernimmt die Seite nur Werte der erwarteten Form, und jede Ausgabe läuft durch die Escape-Funktion.

### Auf GitHub Pages veröffentlichen

Der Ablauf `.github/workflows/pages.yml` baut die Ausgabe bei jedem Push auf `main` und stellt sie bereit. Er bleibt ausgeschaltet, bis diese drei Einstellungen im Repository gesetzt sind:

1. Unter Settings, Pages, Build and deployment als Source „GitHub Actions“ wählen.
2. Unter Settings, Secrets and variables, Actions, Variables zwei Variablen anlegen: `EINFALLSTOR_IMPRESSUM` mit dem ausgefüllten Text aus `content/rechtliches/impressum.beispiel.md` und `EINFALLSTOR_DATENSCHUTZ` mit dem ausgefüllten Text aus `content/rechtliches/datenschutz-statisch.beispiel.md`.
3. Am selben Ort die Variable `EINFALLSTOR_PAGES` mit dem Wert `ja` anlegen.

Danach den Ablauf „Webseite“ unter Actions von Hand starten oder den nächsten Push abwarten. Die Seite liegt dann unter `https://<konto>.github.io/<repository>/`.

Impressum und Datenschutzerklärung stehen in Variablen und nicht im Repository, weil sie zum Betreiber gehören und nicht zum Projekt. Fehlt eine der beiden Seiten oder enthält sie noch Platzhalter, zeigt der Lauf eine Warnung.

### Ohne Einstellungen: der Zweig `gh-pages`

Es geht auch von Hand. Die fertige Ausgabe kommt in einen eigenen Zweig namens `gh-pages`, GitHub liefert dessen Inhalt als Webseite aus. Die Projektseite oben entsteht auf diesem Weg.

```bash
python statisch.py --seiten meine-seiten
git worktree add --orphan -b gh-pages ../einfallstor-seite
cp -r dist/. ../einfallstor-seite/
touch ../einfallstor-seite/.nojekyll
git -C ../einfallstor-seite add -A
git -C ../einfallstor-seite commit -m "Webseite"
git -C ../einfallstor-seite push origin gh-pages
```

Die leere Datei `.nojekyll` sagt GitHub, dass es die Dateien unverändert ausliefern soll. Beim ersten Hochladen hat GitHub die Seite von selbst eingeschaltet. Geschieht das nicht, unter Settings, Pages als Quelle den Zweig `gh-pages` wählen. Für einen neuen Stand den Ordner mit `git worktree add ../einfallstor-seite gh-pages` wieder anlegen, den Inhalt ersetzen und erneut hochladen.

In den Zweig gehört nur, was öffentlich sein darf: Alles darin ist für jeden lesbar, auch der Text der Betreiberseiten.

## Rechtlicher Hinweis

Das Projekt dient der Ausbildung. Teste nur Systeme, die dir gehören oder für die du eine schriftliche Erlaubnis hast. Wer ohne Erlaubnis in fremde Systeme eindringt, macht sich strafbar, in Deutschland unter anderem nach § 202a StGB. Die Lektion „Recht und Ethik“ gibt einen Überblick und ersetzt keine Rechtsberatung.

## Lizenz

MIT, siehe [LICENSE](LICENSE).
