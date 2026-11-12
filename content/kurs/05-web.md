---
titel: Web-Sicherheit verstehen
kurz: Wie Webanwendungen aufgebaut sind, wo ihre typischen Schwächen liegen und wie man sie verhindert.
icon: globe
---

# Wie Webanwendungen funktionieren
minuten: 9
xp: 45

Webanwendungen sind das häufigste Ziel von Penetrationstests. Fast jede Organisation betreibt welche, sie sind aus dem Internet erreichbar, und sie verarbeiten Eingaben von Fremden. Um ihre Schwächen zu verstehen, musst du zuerst wissen, wie sie aufgebaut sind.

## Drei Schichten

Eine typische Webanwendung besteht aus drei Teilen:

| Schicht | Aufgabe | Technik |
|---|---|---|
| Client | zeigt die Oberfläche an und schickt Anfragen | Browser mit HTML, CSS und JavaScript |
| Server | prüft Anfragen und führt die Programmlogik aus | Anwendungscode, zum Beispiel in Python, PHP oder Java |
| Datenbank | speichert Daten dauerhaft | meist ein SQL-Datenbanksystem |

Ein Beispiel: Du meldest dich an. Der Browser schickt Benutzername und Passwort per POST an den Server. Der Server fragt die Datenbank, ob die Angaben stimmen, legt eine Sitzung an und schickt deren Kennung als Cookie zurück. Bei jeder weiteren Anfrage erkennt er dich an diesem Cookie.

## Die wichtigste Regel: Dem Client ist nicht zu trauen

Alles, was vom Browser kommt, kann verändert sein. Formularfelder, Adresszeile, versteckte Felder, Cookies und Header liegen in der Hand des Benutzers. Prüfungen, die nur im Browser stattfinden, zum Beispiel per JavaScript, sind eine Komfortfunktion und kein Schutz. Die verbindliche Prüfung gehört auf den Server.

Der Punkt, an dem Daten von außen in die Anwendung gelangen, heißt Vertrauensgrenze. Ein großer Teil aller Web-Schwachstellen entsteht dort: Die Anwendung behandelt fremde Eingaben, als kämen sie aus vertrauenswürdiger Quelle.

## Anmelden und dürfen

Zwei Begriffe musst du auseinanderhalten:

- **Authentifizierung** klärt, wer du bist. Typisch ist die Anmeldung mit Benutzername und Passwort.
- **Autorisierung** klärt, was du darfst. Ein angemeldeter Kunde darf seine Bestellungen sehen, aber nicht die der anderen.

Fehler bei der Autorisierung gehören zu den häufigsten Befunden überhaupt.

## OWASP und die Top 10

Das Open Worldwide Application Security Project, kurz OWASP, ist eine gemeinnützige Gemeinschaft, die frei verfügbares Wissen zur Sicherheit von Anwendungen veröffentlicht. Ihr bekanntestes Dokument sind die OWASP Top 10, eine Liste der wichtigsten Risikokategorien für Webanwendungen. Sie wird alle paar Jahre überarbeitet. Zu den Dauerbrennern gehören:

- fehlerhafte Zugriffskontrolle
- Fehlkonfiguration
- Injection
- kryptografische Fehler
- veraltete Komponenten
- Schwächen bei der Anmeldung
- fehlende Protokollierung und Überwachung

Die folgenden Lektionen greifen die wichtigsten davon auf: erst die Idee hinter der Schwäche, dann die Abwehr. Die aktuelle Liste findest du auf [owasp.org](https://owasp.org/www-project-top-ten/).

> [!TIPP] Zum praktischen Üben gibt es Schulungsanwendungen, die absichtlich Fehler enthalten, und kostenlose Online-Labore wie die Web Security Academy von PortSwigger. Dort ist das Ausprobieren ausdrücklich erlaubt.

?? Warum reicht eine Eingabeprüfung per JavaScript im Browser nicht als Schutz?
( ) Weil JavaScript zu langsam ist
(x) Weil der Benutzer alles verändern kann, was im Browser geschieht, und Anfragen auch direkt an den Server schicken kann
( ) Weil Browser JavaScript grundsätzlich blockieren
!! Der Client liegt in der Hand des Benutzers. Verbindlich ist nur, was der Server prüft.

?? Was ist der Unterschied zwischen Authentifizierung und Autorisierung?
(x) Authentifizierung klärt, wer jemand ist. Autorisierung klärt, was er darf.
( ) Authentifizierung ist für Administratoren, Autorisierung für normale Benutzer.
( ) Es gibt keinen, beide Wörter bedeuten dasselbe.
!! Erst wird die Identität festgestellt, dann wird geprüft, welche Zugriffe dieser Identität erlaubt sind.

?? Was sind die OWASP Top 10?
( ) Die zehn meistverkauften Sicherheitsprodukte
( ) Zehn Gesetze zur IT-Sicherheit
(x) Eine regelmäßig überarbeitete Liste der wichtigsten Risikokategorien für Webanwendungen
!! Die Liste stammt von der gemeinnützigen OWASP-Gemeinschaft und dient weltweit als Orientierung.

# Injection: wenn Daten zu Befehlen werden
minuten: 10
xp: 50

Injection ist eine der ältesten Schwachstellenklassen im Web und trotzdem nicht ausgestorben. Der Fehler dahinter ist immer derselbe: Eine Anwendung baut aus fremder Eingabe einen Befehl zusammen, und der Empfänger des Befehls kann nicht mehr unterscheiden, was Anweisung ist und was nur Daten sein sollten.

## Ein Vergleich aus dem Alltag

Stell dir ein Formular in einer Bank vor: „Überweise an ____ den Betrag von ____ Euro.“ Ein Sachbearbeiter führt aus, was auf dem Zettel steht. Schreibt jemand in das Feld für den Empfänger statt eines Namens einen ganzen zusätzlichen Satz, und der Sachbearbeiter liest stur vor und handelt danach, dann hat die Eingabe den Auftrag verändert. So funktioniert eine Injection, nur dass der Sachbearbeiter eine Datenbank ist.

## Das Beispiel SQL

Die meisten Webanwendungen speichern ihre Daten in einer Datenbank und sprechen mit ihr in der Sprache SQL. Eine Abfrage könnte lauten: „Gib mir den Benutzer, dessen Name dem eingegebenen Wert entspricht.“

Unsicher wird es, wenn die Anwendung die Eingabe einfach in den Text der Abfrage hineinklebt:

```python
# So nicht: Die Eingabe wird Teil des SQL-Textes.
abfrage = "SELECT * FROM benutzer WHERE name = '" + eingabe + "'"
```

Die Datenbank erhält einen fertigen Text und führt ihn aus. Enthält die Eingabe Zeichen, die in SQL eine besondere Bedeutung haben, verändert sie die Abfrage selbst. Je nach Lage lassen sich so Daten auslesen oder verändern, die dem Benutzer nie zugedacht waren.

## Die Abwehr: Daten und Befehl trennen

Die zuverlässige Lösung heißt parametrisierte Abfrage, auch Prepared Statement genannt. Der SQL-Text enthält Platzhalter, die Werte werden getrennt übergeben:

```python
# Richtig: Platzhalter im SQL-Text, der Wert kommt separat.
cursor.execute("SELECT * FROM benutzer WHERE name = ?", (eingabe,))
```

Die Datenbank kennt jetzt die Struktur der Abfrage, bevor sie den Wert sieht. Was auch immer in der Eingabe steht, es bleibt ein Wert und wird nie als SQL gelesen.

Weitere Schutzschichten ergänzen das:

- **Eingaben prüfen:** Ein Feld für eine Postleitzahl nimmt nur fünf Ziffern an.
- **Geringste Rechte:** Das Datenbankkonto der Anwendung darf nur, was die Anwendung braucht.
- **Fehlermeldungen kürzen:** Der Benutzer sieht „Etwas ist schiefgelaufen“ und keine Details zur Datenbank.

## Dieselbe Idee an anderen Stellen

SQL ist nur das bekannteste Beispiel. Das Muster wiederholt sich überall, wo Eingaben in einen Befehl einfließen: bei Kommandos an das Betriebssystem, bei Abfragen an Verzeichnisdienste oder in Vorlagen für Webseiten. Die Abwehr folgt jedes Mal demselben Gedanken: Eingaben werden als Daten übergeben und nicht in Befehlstext eingebaut.

## Wie Prüfer vorgehen

In einem beauftragten Test gilt jedes Eingabefeld, jeder Parameter in der Adresszeile und jeder Header als möglicher Eintrittspunkt. Der Prüfer beobachtet, ob ungewöhnliche Eingaben das Verhalten der Anwendung verändern, etwa durch eine Fehlermeldung der Datenbank. Bestätigt sich der Verdacht, dokumentiert er die Stelle und empfiehlt parametrisierte Abfragen.

> [!ABWEHR] Diese Plattform verwendet ausschließlich parametrisierte Abfragen. Wie das im Code aussieht, zeigt die Seite [Sicherheitskonzept](#/sicherheit).

?? Was ist die gemeinsame Ursache aller Injection-Schwachstellen?
( ) Zu schwache Passwörter
( ) Fehlende Verschlüsselung der Verbindung
(x) Fremde Eingaben werden in einen Befehl eingebaut und dadurch als Anweisung interpretiert
!! Bei einer Injection verschwimmt die Grenze zwischen Daten und Befehl. Der Empfänger führt aus, was eigentlich nur ein Wert sein sollte.

?? Welche Maßnahme schützt zuverlässig vor SQL-Injection?
(x) Parametrisierte Abfragen, bei denen Werte getrennt vom SQL-Text übergeben werden
( ) Ein längeres Passwort für die Datenbank
( ) Das Verstecken des Anmeldeformulars
!! Mit Platzhaltern steht die Struktur der Abfrage fest, bevor die Datenbank den Wert sieht. Die Eingabe bleibt ein Wert.

?? Warum sollte das Datenbankkonto einer Webanwendung nur wenige Rechte haben?
( ) Damit die Anwendung schneller läuft
(x) Damit eine ausgenutzte Lücke möglichst wenig Schaden anrichten kann
( ) Weil Datenbanken sonst keine Verbindungen annehmen
!! Das Prinzip der geringsten Rechte begrenzt den Schaden, falls doch eine Lücke ausgenutzt wird.

?? Eine Anwendung zeigt bei einem Fehler die vollständige Meldung der Datenbank an. Warum ist das ein Problem?
( ) Weil Fehlermeldungen die Seite langsamer machen
( ) Weil Benutzer davon verwirrt werden
(x) Weil die Meldung Einzelheiten über den Aufbau der Datenbank verrät
!! Ausführliche Fehlermeldungen gehören ins Protokoll des Servers. Der Benutzer bekommt nur einen allgemeinen Hinweis.

# Cross-Site-Scripting und Sitzungen
minuten: 10
xp: 50

Bei einer Injection landet fremde Eingabe in einem Befehl an die Datenbank. Beim Cross-Site-Scripting, kurz XSS, landet sie in der Webseite selbst und wird im Browser eines anderen Benutzers als Programmcode behandelt.

## Die Idee

Viele Seiten zeigen an, was Benutzer eingegeben haben: Kommentare, Profilnamen, Suchbegriffe. Fügt die Anwendung solchen Text unverändert in die Seite ein, kann er HTML und JavaScript enthalten. Der Browser des nächsten Besuchers kann nicht erkennen, dass dieser Code nicht vom Betreiber stammt.

Fremder Code läuft dann mit den Rechten der betroffenen Seite. Er kann den Seiteninhalt lesen und verändern oder im Namen des angemeldeten Benutzers Aktionen auslösen.

## Drei Spielarten

| Art | Wo der Code herkommt |
|---|---|
| Gespeichert (stored) | Er wurde in der Anwendung gespeichert, zum Beispiel als Kommentar, und trifft jeden, der die Seite öffnet. |
| Reflektiert (reflected) | Er steckt in einer Anfrage, etwa in einem präparierten Link, und kommt in der Antwort sofort zurück. |
| DOM-basiert | Er wird erst im Browser von fehlerhaftem JavaScript der Seite in das Dokument eingebaut. |

## Die Abwehr: Ausgaben kodieren

Die wichtigste Maßnahme ist, Text beim Ausgeben so umzuwandeln, dass der Browser ihn als Text behandelt. Aus Zeichen mit besonderer Bedeutung in HTML werden harmlose Ersatzzeichen:

| Zeichen | wird zu |
|---|---|
| `<` | `&lt;` |
| `>` | `&gt;` |
| `&` | `&amp;` |
| `"` | `&quot;` |

Moderne Template-Systeme erledigen das automatisch. In JavaScript gilt die Faustregel, Text mit `textContent` einzusetzen und nicht mit `innerHTML`.

Dazu kommt eine zweite Verteidigungslinie: die Content Security Policy (CSP). Mit diesem Header teilt der Server dem Browser mit, aus welchen Quellen Skripte überhaupt geladen werden dürfen. Code aus anderen Quellen wird blockiert.

## Warum die Sitzung so wertvoll ist

Aus der Lektion über HTTP weißt du: Nach der Anmeldung erkennt der Server dich an der Sitzungskennung im Cookie. Wer diese Kennung besitzt, ist für den Server der angemeldete Benutzer. Deshalb wird sie mit drei Kennzeichen geschützt:

| Kennzeichen | Wirkung |
|---|---|
| `HttpOnly` | JavaScript kann das Cookie nicht auslesen. |
| `Secure` | Das Cookie wird nur über HTTPS übertragen. |
| `SameSite` | Das Cookie wird bei Anfragen, die von fremden Seiten ausgelöst werden, nicht mitgeschickt. |

`SameSite` hilft gegen ein verwandtes Problem, die Cross-Site Request Forgery (CSRF). Dabei bringt eine fremde Seite den Browser eines angemeldeten Benutzers dazu, ungewollt eine Anfrage an die Anwendung zu schicken, zum Beispiel eine Passwortänderung.

> [!PRAXIS] Sieh selbst nach: Melde dich hier an, drücke F12 und öffne unter „Anwendung“ oder „Web-Speicher“ die Cookies dieser Seite. Du findest das Cookie `sid` mit den Kennzeichen HttpOnly und SameSite.

?? Wo wird fremder Code bei Cross-Site-Scripting ausgeführt?
( ) In der Datenbank des Servers
(x) Im Browser eines Benutzers, der die betroffene Seite öffnet
( ) Auf dem Router
!! XSS trifft den Browser der Besucher. Der Code läuft dort im Zusammenhang der betroffenen Seite.

?? Welche Maßnahme ist der wichtigste Schutz vor XSS?
( ) Lange Passwörter
( ) Ein anderer Port für den Webserver
(x) Benutzereingaben beim Ausgeben kodieren, sodass der Browser sie als Text behandelt
!! Durch die Kodierung verlieren die spitzen Klammern und andere Zeichen ihre besondere Bedeutung. Der Text wird angezeigt und nicht ausgeführt.

?? Was bewirkt das Kennzeichen HttpOnly an einem Cookie?
(x) JavaScript im Browser kann das Cookie nicht auslesen.
( ) Das Cookie wird verschlüsselt gespeichert.
( ) Das Cookie gilt nur für eine Stunde.
!! HttpOnly entzieht das Cookie dem Zugriff durch Skripte. Selbst bei einer XSS-Lücke bleibt die Sitzungskennung so geschützt.

?? Was leistet eine Content Security Policy?
( ) Sie verschlüsselt die Datenbank.
(x) Sie legt fest, aus welchen Quellen der Browser Skripte und andere Inhalte laden darf.
( ) Sie ersetzt die Anmeldung mit Passwort.
!! Die CSP ist eine zweite Verteidigungslinie: Code aus nicht erlaubten Quellen führt der Browser nicht aus.

# Zugriffskontrolle und Anmeldung
minuten: 9
xp: 45

Fehlerhafte Zugriffskontrolle steht seit Jahren weit oben in den Listen der häufigsten Web-Schwachstellen. Der Grund: Sie lässt sich nicht mit einem Werkzeug oder einer Bibliothek erledigen. Für jede einzelne Funktion muss jemand festlegen und prüfen, wer sie benutzen darf.

## Wenn die Prüfung fehlt

Eine Anwendung zeigt Rechnungen unter Adressen wie dieser an:

```
https://shop.beispiel.de/rechnung?nr=1001
```

Der angemeldete Kunde sieht seine Rechnung Nummer 1001. Was passiert, wenn in der Adresse eine andere Nummer steht? Eine korrekte Anwendung prüft bei jeder Anfrage, ob die Rechnung dem angemeldeten Benutzer gehört, und lehnt sonst ab. Fehlt diese Prüfung, bekommt er die Rechnung eines Fremden zu sehen.

Diese Schwäche hat einen sperrigen Namen: Insecure Direct Object Reference, kurz IDOR. Sie ist leicht zu verstehen, und sie kommt in echten Prüfungen regelmäßig vor.

Typische Formen fehlerhafter Zugriffskontrolle:

- Die Anwendung prüft Kennungen in Adressen oder Formularen nicht gegen den angemeldeten Benutzer.
- Verwaltungsfunktionen sind nur in der Oberfläche ausgeblendet, die Adresse dahinter funktioniert aber für jeden.
- Die Weboberfläche prüft Rechte, die Programmierschnittstelle (API) dahinter nicht.

## Die Abwehr

- **Standardmäßig verbieten.** Was nicht ausdrücklich erlaubt ist, wird abgelehnt.
- **Auf dem Server prüfen**, bei jeder Anfrage und für jedes Objekt.
- **Rollen sauber trennen** und für jede Rolle testen, was sie nicht darf.
- **Zugriffe protokollieren**, damit Missbrauch auffällt.

## Schwächen bei der Anmeldung

Auch die Anmeldung selbst kann Fehler haben:

| Schwäche | Folge | Abhilfe |
|---|---|---|
| Beliebig viele Anmeldeversuche | Passwörter lassen sich durchprobieren | Versuche begrenzen, verzögern, melden |
| Unterschiedliche Fehlermeldungen | „Benutzer unbekannt“ verrät, welche Konten es gibt | einheitliche Meldung für beide Fälle |
| Standardzugangsdaten | Konten mit Werkspasswort bleiben aktiv | bei der Einrichtung ändern, Konten abschalten |
| Nur ein Faktor | ein gestohlenes Passwort genügt | Zwei-Faktor-Anmeldung |
| Schwaches Zurücksetzen | Konten lassen sich über „Passwort vergessen“ übernehmen | Einmal-Links mit kurzer Gültigkeit |

Zwei-Faktor-Anmeldung heißt, dass neben dem Passwort ein zweiter Nachweis nötig ist, zum Beispiel ein Code aus einer App oder ein Sicherheitsschlüssel. Sie ist die wirksamste Einzelmaßnahme gegen gestohlene Passwörter.

## So macht es diese Plattform

Probiere es an deinem eigenen Konto aus: Bei einer falschen Anmeldung antwortet diese Seite immer mit derselben Meldung, egal ob der Benutzername unbekannt oder nur das Passwort falsch ist. Nach mehreren Fehlversuchen in kurzer Zeit wird die Anmeldung für einen Moment gesperrt. Beides ist im [Sicherheitskonzept](#/sicherheit) beschrieben.

?? Ein Kunde bekommt über eine geänderte Rechnungsnummer in der Adresse die Rechnung eines anderen Kunden angezeigt. Welche Schwäche liegt vor?
( ) Cross-Site-Scripting
( ) Eine schwache Verschlüsselung
(x) Fehlerhafte Zugriffskontrolle: Der Server prüft nicht, wem das Objekt gehört.
!! Der Server muss bei jeder Anfrage prüfen, ob der angemeldete Benutzer auf dieses Objekt zugreifen darf.

?? Warum sollte eine Anmeldeseite bei falschem Benutzernamen und falschem Passwort dieselbe Fehlermeldung zeigen?
(x) Damit sich nicht herausfinden lässt, welche Benutzernamen existieren
( ) Damit die Seite schneller lädt
( ) Weil Browser nur eine Fehlermeldung anzeigen können
!! Unterschiedliche Meldungen verraten gültige Benutzernamen. Mit einer einheitlichen Meldung bleibt das verborgen.

?? Eine Verwaltungsseite ist im Menü für normale Benutzer ausgeblendet. Reicht das als Schutz?
( ) Ja, was man nicht sieht, kann man nicht aufrufen.
(x) Nein, der Server muss bei jedem Aufruf prüfen, ob der Benutzer die Berechtigung hat.
( ) Ja, solange die Seite HTTPS verwendet.
!! Ausblenden ist keine Zugriffskontrolle. Die Prüfung muss auf dem Server stattfinden.

?? Welche Einzelmaßnahme schützt am wirksamsten vor dem Missbrauch gestohlener Passwörter?
( ) Ein Passwortwechsel alle 30 Tage
( ) Ein längerer Benutzername
(x) Zwei-Faktor-Anmeldung
!! Mit einem zweiten Faktor genügt das Passwort allein nicht mehr für die Anmeldung.
