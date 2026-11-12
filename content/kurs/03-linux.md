---
titel: Linux-Grundlagen
kurz: Die Shell bedienen, Rechte lesen, Dateien und Protokolle durchsuchen. Alles zum Ausprobieren im Übungsterminal.
icon: terminal
---

# Die Shell: erste Schritte
minuten: 9
xp: 45

Die meisten Server im Internet laufen mit Linux, und fast alle Sicherheitswerkzeuge werden über die Kommandozeile bedient. Die Kommandozeile heißt unter Linux Shell. Du tippst einen Befehl, drückst Enter, und die Shell zeigt das Ergebnis.

Am besten öffnest du jetzt das [Übungsterminal](#/terminal) in einem zweiten Tab und probierst jeden Befehl gleich aus.

## Der Prompt

Die Shell meldet sich mit einer Eingabeaufforderung, dem Prompt:

```
lehrling@uebungsbox:~$
```

Darin steckt: Du bist als Benutzer `lehrling` am Rechner `uebungsbox` angemeldet und befindest dich im Verzeichnis `~`. Die Tilde ist die Abkürzung für dein Home-Verzeichnis. Das Dollarzeichen zeigt an, dass du ein normaler Benutzer bist. Beim Administrator steht dort eine Raute.

## Sich umsehen

| Befehl | Wirkung |
|---|---|
| `pwd` | zeigt, in welchem Verzeichnis du gerade bist |
| `ls` | listet den Inhalt des Verzeichnisses |
| `ls -l` | dasselbe mit Details wie Rechten und Größe |
| `ls -a` | zeigt auch versteckte Dateien |
| `cd projekte` | wechselt in das Verzeichnis projekte |
| `cd ..` | geht eine Ebene nach oben |
| `cd` | springt zurück ins Home-Verzeichnis |
| `cat datei.txt` | gibt den Inhalt einer Datei aus |

Befehle haben meistens Optionen, die mit einem Bindestrich beginnen. `ls -la` kombiniert die Optionen `-l` und `-a`. Was ein Befehl kann, steht in seiner Anleitung: `man ls` öffnet sie.

## Versteckte Dateien

Dateien, deren Name mit einem Punkt beginnt, blendet `ls` aus. Mit einem Geheimnis hat das nichts zu tun, es hält nur das Verzeichnis übersichtlich. Programme legen dort ihre Einstellungen ab, zum Beispiel `.bashrc`. Für Prüfer sind solche Dateien interessant, weil in ihnen manchmal Dinge stehen, die dort nicht hingehören.

## Der Verzeichnisbaum

Linux kennt keine Laufwerksbuchstaben. Alles hängt an einer einzigen Wurzel, geschrieben als `/`:

| Pfad | Inhalt |
|---|---|
| `/home` | persönliche Verzeichnisse der Benutzer |
| `/root` | Home-Verzeichnis des Administrators |
| `/etc` | Konfigurationsdateien des Systems |
| `/var/log` | Protokolldateien |
| `/tmp` | temporäre Dateien |
| `/bin`, `/usr/bin` | Programme |

Ein Pfad, der mit `/` beginnt, ist absolut und gilt von überall. Alle anderen Pfade sind relativ zum aktuellen Verzeichnis. `cd /var/log` funktioniert immer, `cd log` nur, wenn du gerade in `/var` stehst.

## Zwei Tasten, die Zeit sparen

Die Tabulatortaste vervollständigt Befehle und Dateinamen. Die Pfeiltaste nach oben holt frühere Befehle zurück. Beides funktioniert auch im Übungsterminal.

> [!PRAXIS] Die ersten drei Missionen im [Übungsterminal](#/terminal) üben diese Befehle.

?? Welcher Befehl zeigt auch versteckte Dateien an?
( ) `ls -l`
(x) `ls -a`
( ) `pwd`
!! Die Option -a (für „all“) blendet auch Dateien ein, deren Name mit einem Punkt beginnt.

?? Was bedeutet die Tilde ~ in einem Pfad?
( ) Die Wurzel des Dateisystems
( ) Das übergeordnete Verzeichnis
(x) Das Home-Verzeichnis des angemeldeten Benutzers
!! Die Tilde steht für das eigene Home-Verzeichnis. Die Wurzel ist /, das übergeordnete Verzeichnis erreichst du mit zwei Punkten.

?? In welchem Verzeichnis liegen unter Linux üblicherweise die Protokolldateien?
(x) `/var/log`
( ) `/etc`
( ) `/home`
!! Protokolle stehen in /var/log. In /etc liegt die Konfiguration, in /home liegen die Benutzerverzeichnisse.

?? Welcher dieser Pfade ist absolut?
( ) `projekte/notizen`
( ) `../log`
(x) `/etc/hosts`
!! Absolute Pfade beginnen mit / und gelten unabhängig vom aktuellen Verzeichnis.

# Benutzer, Rechte und sudo
minuten: 10
xp: 50

Linux ist ein Mehrbenutzersystem. Zu jeder Datei ist festgelegt, wem sie gehört und wer was mit ihr tun darf. Viele Sicherheitsprobleme sind am Ende falsch gesetzte Rechte. Deshalb musst du sie lesen können.

## Benutzer und Gruppen

Jeder Benutzer hat einen Namen und gehört zu einer oder mehreren Gruppen. `whoami` zeigt, wer du bist, `id` zeigt zusätzlich deine Gruppen. Ein Benutzer ist besonders: `root`, der Administrator. Für root gelten keine Dateirechte, er darf alles.

## Die Rechtezeile lesen

`ls -l` zeigt vor jedem Eintrag zehn Zeichen:

```
-rwxr-xr-- 1 lehrling team 2048 Nov  3 09:12 skript.sh
```

Das erste Zeichen nennt den Typ: `-` für eine Datei, `d` für ein Verzeichnis. Die folgenden neun Zeichen bilden drei Dreiergruppen:

| Zeichen | Gilt für | Im Beispiel |
|---|---|---|
| 2 bis 4 | den Besitzer | `rwx`, darf alles |
| 5 bis 7 | die Gruppe | `r-x`, darf lesen und ausführen |
| 8 bis 10 | alle anderen | `r--`, dürfen nur lesen |

Die Buchstaben bedeuten:

| Recht | bei einer Datei | bei einem Verzeichnis |
|---|---|---|
| `r` (read) | Inhalt lesen | Inhalt auflisten |
| `w` (write) | Inhalt ändern | Dateien anlegen und löschen |
| `x` (execute) | als Programm ausführen | hineinwechseln |

Hinter den Rechten stehen Besitzer (`lehrling`) und Gruppe (`team`).

## Rechte als Zahlen

Oft werden Rechte als drei Ziffern geschrieben. Jedes Recht hat einen Wert: `r` zählt 4, `w` zählt 2, `x` zählt 1. Pro Dreiergruppe werden die Werte addiert.

| Zahl | Rechte | typische Verwendung |
|---|---|---|
| 644 | `rw-r--r--` | normale Datei: Besitzer schreibt, alle lesen |
| 755 | `rwxr-xr-x` | Programm oder Verzeichnis |
| 600 | `rw-------` | private Datei, zum Beispiel ein Schlüssel |
| 777 | `rwxrwxrwx` | jeder darf alles, fast immer ein Fehler |

Mit `chmod` änderst du Rechte, zum Beispiel `chmod 600 notizen.txt`. Mit `chown` änderst du den Besitzer.

## sudo: Rechte auf Zeit

Als root zu arbeiten ist gefährlich, weil jeder Tippfehler das System treffen kann. Üblich ist deshalb, als normaler Benutzer zu arbeiten und einzelne Befehle mit `sudo` als root auszuführen. Wer das darf und für welche Befehle, legt der Administrator fest.

Dahinter steht ein Grundsatz, der dir im ganzen Kurs wieder begegnet: das Prinzip der geringsten Rechte (englisch least privilege). Jeder Benutzer und jedes Programm bekommt nur die Rechte, die für die Aufgabe nötig sind.

## Was Prüfer an Rechten interessiert

Bei einer Sicherheitsprüfung wird unter anderem gesucht nach:

- Dateien, die jeder verändern darf, obwohl wichtige Programme sie lesen oder ausführen
- Dateien mit Zugangsdaten, die für alle lesbar sind
- sudo-Regeln, die mehr erlauben als nötig

Die Datei `/etc/shadow` zeigt, wie es richtig ist: Sie enthält die Passwort-Hashes aller Benutzer und ist deshalb für normale Benutzer nicht lesbar. Im Übungsterminal kannst du ausprobieren, was passiert, wenn du sie trotzdem öffnen willst.

> [!PRAXIS] In der Mission „Rechte lesen“ suchst du im [Übungsterminal](#/terminal) eine Datei, die jeder verändern darf.

?? Was darf die Gruppe bei den Rechten rwxr-x--- ?
( ) Lesen, schreiben und ausführen
(x) Lesen und ausführen
( ) Gar nichts
!! Die mittlere Dreiergruppe gilt für die Gruppe: r-x heißt lesen und ausführen, aber nicht schreiben.

?? Welche Rechtezeile entspricht der Zahl 644?
(x) `rw-r--r--`
( ) `rwxr-xr-x`
( ) `rw-------`
!! 6 = 4 + 2 ergibt rw-, die beiden Vieren ergeben jeweils r--. Zusammen rw-r--r--.

?? Was besagt das Prinzip der geringsten Rechte?
( ) Nur root darf Programme starten.
( ) Jeder Benutzer bekommt zur Sicherheit alle Rechte.
(x) Benutzer und Programme bekommen nur die Rechte, die sie für ihre Aufgabe brauchen.
!! Je weniger Rechte ein Konto hat, desto kleiner ist der Schaden, wenn es missbraucht wird.

?? Warum dürfen normale Benutzer /etc/shadow nicht lesen?
( ) Weil die Datei sehr groß ist
(x) Weil sie die Passwort-Hashes der Benutzer enthält
( ) Weil sie nur beim Systemstart gebraucht wird
!! Passwort-Hashes sollen nicht in fremde Hände gelangen. Deshalb ist die Datei für normale Benutzer gesperrt.

# Suchen, filtern, verketten
minuten: 10
xp: 50

Ein Server hat Hunderttausende Dateien und Protokolle mit Millionen Zeilen. Niemand liest das von Hand. Die Shell bringt kleine Werkzeuge mit, die jeweils eine Sache gut können, und einen Mechanismus, um sie zu verketten.

## Dateien finden mit find

`find` durchsucht einen Verzeichnisbaum nach Dateien mit bestimmten Eigenschaften:

```
find /etc -name "*.conf"
find /srv -type d
find . -name "notiz*"
```

Das erste Argument ist der Startpunkt, danach folgen Bedingungen. `-name` vergleicht den Dateinamen, wobei der Stern für beliebige Zeichen steht. `-type f` beschränkt die Suche auf Dateien, `-type d` auf Verzeichnisse.

## Text finden mit grep

`grep` durchsucht den Inhalt von Dateien und gibt jede Zeile aus, die das Suchmuster enthält:

```
grep "Failed" /var/log/auth.log
```

Die wichtigsten Optionen:

| Option | Wirkung |
|---|---|
| `-i` | Groß- und Kleinschreibung ignorieren |
| `-n` | Zeilennummern anzeigen |
| `-c` | nur die Anzahl der Treffer ausgeben |
| `-v` | Zeilen ausgeben, die das Muster nicht enthalten |
| `-r` | ein Verzeichnis samt Unterverzeichnissen durchsuchen |

## Anfang, Ende, Anzahl

- `head -n 5 datei` zeigt die ersten fünf Zeilen.
- `tail -n 5 datei` zeigt die letzten fünf Zeilen.
- `wc -l datei` zählt die Zeilen.
- `sort` sortiert Zeilen, `uniq -c` fasst gleiche aufeinanderfolgende Zeilen zusammen und zählt sie.

## Die Pipe

Der senkrechte Strich heißt Pipe. Er leitet die Ausgabe eines Befehls als Eingabe an den nächsten weiter:

```
grep "Failed password" /var/log/auth.log | wc -l
```

Hier sucht `grep` alle Zeilen mit fehlgeschlagenen Anmeldungen, und `wc -l` zählt sie. So entsteht aus zwei einfachen Befehlen eine Auswertung.

Pipes lassen sich beliebig verlängern:

```
cat /var/log/auth.log | grep "Failed" | tail -n 3
```

## Ein Protokoll lesen

In `/var/log/auth.log` protokolliert Linux Anmeldungen. Eine Zeile sieht zum Beispiel so aus:

```
Nov 03 02:14:09 uebungsbox sshd[1042]: Failed password for root from 203.0.113.44 port 51124 ssh2
```

Von links nach rechts: Datum und Uhrzeit, Name des Rechners, zuständiger Dienst, dann die Meldung. Hier ist eine Anmeldung als root fehlgeschlagen, der Versuch kam von der Adresse 203.0.113.44. Viele solcher Zeilen von derselben Adresse in kurzer Zeit deuten darauf hin, dass jemand Passwörter durchprobiert.

Protokolle zu lesen gehört zu beiden Seiten des Berufs. Verteidiger erkennen daran Angriffe. Prüfer sehen daran, welche Spuren ihre eigene Arbeit hinterlässt.

> [!PRAXIS] Die Missionen 5 bis 8 im [Übungsterminal](#/terminal) verlangen diese Werkzeuge.

?? Was bewirkt die Pipe zwischen zwei Befehlen?
( ) Sie führt beide Befehle gleichzeitig aus.
(x) Sie übergibt die Ausgabe des ersten Befehls als Eingabe an den zweiten.
( ) Sie speichert die Ausgabe in einer Datei.
!! Die Pipe verbindet Ausgabe und Eingabe. Zum Speichern in eine Datei dient die Umleitung mit dem Größer-Zeichen.

?? Mit welchem Befehl findest du alle Dateien unter /etc, deren Name auf .conf endet?
(x) `find /etc -name "*.conf"`
( ) `grep ".conf" /etc`
( ) `ls -a /etc`
!! find sucht nach Dateinamen. grep sucht im Inhalt von Dateien, ls -a zeigt nur ein einzelnes Verzeichnis.

?? Welche Option lässt grep die Groß- und Kleinschreibung ignorieren?
( ) `-c`
( ) `-v`
(x) `-i`
!! -i steht für „ignore case“. -c zählt Treffer, -v kehrt die Suche um.

?? Was gibt diese Befehlskette aus: grep "Failed" auth.log, per Pipe weitergereicht an wc -l?
( ) Die letzte Zeile mit dem Wort Failed
( ) Alle Zeilen ohne das Wort Failed
(x) Die Anzahl der Zeilen, die das Wort Failed enthalten
!! grep liefert die passenden Zeilen, wc -l zählt sie.
