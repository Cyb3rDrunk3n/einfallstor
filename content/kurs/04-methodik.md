---
titel: Methodik
kurz: Wie ein Pentest abläuft: von der Beauftragung über Recherche und Analyse bis zur Nachbereitung.
icon: route
---

# Die Phasen eines Pentests
minuten: 10
xp: 50

Ein Pentest ist kein planloses Herumprobieren. Er folgt einem festen Ablauf, damit nichts vergessen wird, damit kein Schaden entsteht und damit sich jedes Ergebnis später nachvollziehen lässt.

## Bekannte Vorgehensmodelle

Zwei Modelle begegnen dir immer wieder. Das Bundesamt für Sicherheit in der Informationstechnik (BSI) beschreibt in seiner Studie „Durchführungskonzept für Penetrationstests“ fünf Phasen: Vorbereitung, Informationsbeschaffung, Bewertung der Informationen, aktive Eindringversuche und Abschlussanalyse. Der Penetration Testing Execution Standard (PTES) gliedert etwas feiner in sieben Abschnitte. Im Ablauf decken sich beide weitgehend.

Für diesen Kurs reichen sechs Schritte:

| Phase | Was geschieht | Ergebnis |
|---|---|---|
| 1. Vorbereitung | Ziele, Scope, Regeln und Ansprechpartner festlegen | unterschriebene Beauftragung |
| 2. Informationsbeschaffung | öffentlich verfügbare Informationen über das Ziel sammeln | Überblick über Systeme und Technik |
| 3. Analyse | erreichbare Dienste ermitteln und auf Schwächen untersuchen | Liste möglicher Schwachstellen |
| 4. Verifikation | im vereinbarten Rahmen prüfen, welche Schwächen wirklich bestehen | belegte Befunde |
| 5. Nachbereitung | Testkonten, Dateien und Änderungen entfernen | System im Ausgangszustand |
| 6. Bericht | Befunde bewerten, Maßnahmen empfehlen, Ergebnis besprechen | Abschlussbericht |

## Vorbereitung ist die halbe Arbeit

In der ersten Phase fließt noch kein einziges Datenpaket. Trotzdem hängt von ihr ab, ob der Test etwas taugt. Hier wird geklärt, was der Auftraggeber wissen will. „Ist unser Webshop sicher?“ ist eine andere Frage als „Kommt jemand vom Gäste-WLAN ins Firmennetz?“, und sie führt zu einem anderen Test.

## Verifikation mit Augenmaß

An die vierte Phase denken alle zuerst. In der Praxis nimmt sie den kleineren Teil der Zeit ein. Der Tester weist nach, dass eine Schwäche real ist, und geht dabei so schonend wie möglich vor. Es genügt zu zeigen, dass ein Zugriff möglich wäre. Niemand muss dafür die Kundendatenbank kopieren.

## Regeln, die in jeder Phase gelten

- **Alles mitschreiben.** Jeder Schritt bekommt Datum, Uhrzeit, Ziel und Ergebnis. Ohne Protokoll gibt es keinen belastbaren Bericht.
- **Im Scope bleiben.** Führt eine Spur zu einem System außerhalb des Geltungsbereichs, endet sie dort. Der Auftraggeber wird informiert und legt fest, wie es weitergeht.
- **Bei Gefahr abbrechen.** Wird ein System instabil, stoppt der Test, und der Ansprechpartner wird angerufen.
- **Kritisches sofort melden.** Eine schwere Lücke oder Hinweise auf einen echten Einbruch warten nicht bis zum Abschlussbericht.

> [!MERKE] Die Phasen laufen nicht streng nacheinander ab. Neue Informationen aus der Analyse führen oft zurück zur Informationsbeschaffung. Der Ablauf ist ein Kreislauf.

?? Was geschieht in der Vorbereitungsphase eines Pentests?
( ) Die ersten Systeme werden gescannt.
(x) Ziele, Scope, Regeln und Ansprechpartner werden festgelegt.
( ) Der Abschlussbericht wird geschrieben.
!! Vor dem ersten Test steht die Beauftragung mit klarem Ziel und Geltungsbereich.

?? Während eines Tests führt eine Spur zu einem Server, der nicht im Scope steht. Was tust du?
( ) Kurz prüfen, ob er verwundbar ist, und es im Bericht erwähnen
( ) Den Server gleich mittesten, weil er offensichtlich dazugehört
(x) Den Server nicht anfassen und den Auftraggeber informieren
!! Außerhalb des Scope fehlt die Erlaubnis. Der Auftraggeber legt fest, ob der Geltungsbereich erweitert wird.

?? Warum wird während eines Tests jeder Schritt mit Zeitangabe protokolliert?
(x) Damit sich die Befunde später nachvollziehen und belegen lassen
( ) Weil die Werkzeuge sonst nicht starten
( ) Damit der Test länger dauert
!! Das Protokoll ist die Grundlage des Berichts. Außerdem lässt sich damit klären, ob ein Vorfall beim Kunden mit dem Test zusammenhängt.

?? Du findest während des Tests Hinweise, dass bereits ein echter Angreifer im System ist. Was ist richtig?
( ) Bis zum Abschlussbericht warten, damit der Test nicht gestört wird
(x) Den Ansprechpartner des Auftraggebers sofort informieren
( ) Die Spuren des Angreifers selbst beseitigen
!! Ein echter Einbruch ist ein Notfall. Der Auftraggeber muss sofort davon erfahren, Spuren dürfen nicht verändert werden.

# Informationsbeschaffung
minuten: 9
xp: 45

Bevor ein Tester ein System berührt, sammelt er, was über das Ziel öffentlich bekannt ist. Diese Phase heißt auf Englisch Reconnaissance, kurz Recon. Sie zeigt regelmäßig, dass Organisationen mehr über sich preisgeben, als ihnen bewusst ist.

## Passiv und aktiv

Bei der passiven Informationsbeschaffung entsteht kein direkter Kontakt zu den Systemen des Ziels. Der Tester wertet nur aus, was ohnehin öffentlich ist. Aktiv wird es, sobald er die Systeme selbst anspricht, etwa mit einem Scan. Passive Recherche in öffentlichen Quellen heißt auch OSINT, kurz für Open Source Intelligence.

Die Grenze ist wichtig, weil aktive Schritte nur im vereinbarten Scope erlaubt sind.

## Wo Informationen liegen

| Quelle | Was sich daraus ablesen lässt |
|---|---|
| Website der Organisation | Standorte, Ansprechpartner, eingesetzte Produkte |
| Stellenanzeigen | verwendete Technik („Erfahrung mit … erwünscht“) |
| DNS-Einträge | Subdomains, Mailserver, Hosting-Anbieter |
| Zertifikatsprotokolle | Namen von Systemen, für die Zertifikate ausgestellt wurden |
| Berufsnetzwerke | Namen und Rollen von Mitarbeitern, Aufbau von E-Mail-Adressen |
| Öffentliche Code-Ablagen | versehentlich veröffentlichte Konfiguration oder Zugangsdaten |

Zertifikatsprotokolle verdienen eine Erklärung: Zertifizierungsstellen tragen jedes ausgestellte TLS-Zertifikat in öffentliche Verzeichnisse ein, das Verfahren heißt Certificate Transparency. Wer für `intern-test.beispiel.de` ein Zertifikat beantragt, hat diesen Namen damit veröffentlicht.

## Ordnung halten

Informationen sind nur nützlich, wenn man sie wiederfindet. Bewährt hat sich eine einfache Tabelle mit vier Spalten: Was wurde gefunden, wo, wann, und warum ist es wichtig? Aus dieser Tabelle entsteht die Liste der Systeme, die in der nächsten Phase untersucht werden. Vorher wird sie mit dem Scope abgeglichen. Was nicht freigegeben ist, fliegt von der Liste.

## Datenschutz gilt auch hier

Namen, E-Mail-Adressen und Profile sind personenbezogene Daten. Auch im Auftrag gilt die Datenschutz-Grundverordnung: Gesammelt wird nur, was für den Auftrag nötig ist, und nach Abschluss wird es gelöscht oder übergeben, wie es der Vertrag vorsieht.

## Die Sicht der Verteidigung

Aus dieser Phase lässt sich direkt ableiten, was eine Organisation tun kann:

- regelmäßig prüfen, was über sie öffentlich auffindbar ist
- alte Subdomains und vergessene Testsysteme abschalten
- keine Zugangsdaten in Code-Ablagen speichern
- Mitarbeiter dafür sensibilisieren, was sie beruflich im Netz teilen

> [!ABWEHR] Was nicht öffentlich ist, kann in dieser Phase nicht gefunden werden. Ein gepflegtes Inventar der eigenen Systeme ist die Voraussetzung dafür.

?? Was kennzeichnet passive Informationsbeschaffung?
(x) Es werden nur öffentlich verfügbare Quellen ausgewertet, ohne die Systeme des Ziels direkt anzusprechen.
( ) Der Tester wartet, bis das Ziel sich bei ihm meldet.
( ) Es werden nur Systeme im internen Netz gescannt.
!! Passiv heißt: kein direkter Kontakt zu den Zielsystemen. Ein Scan wäre bereits aktiv.

?? Warum können Stellenanzeigen für einen Tester aufschlussreich sein?
( ) Weil dort Passwörter stehen
( ) Weil sie den Scope festlegen
(x) Weil sie oft verraten, welche Technik eine Organisation einsetzt
!! Gesuchte Kenntnisse lassen Rückschlüsse auf Produkte und Systeme zu. Den Scope legt allein die Beauftragung fest.

?? Was bedeutet OSINT?
( ) Ein Werkzeug zum Scannen von Ports
(x) Informationsgewinnung aus öffentlich zugänglichen Quellen
( ) Ein Verschlüsselungsverfahren
!! OSINT steht für Open Source Intelligence, also das Auswerten offener Quellen.

# Scannen und Enumerieren: das Prinzip
minuten: 10
xp: 50

Nach der Recherche folgt der erste direkte Kontakt mit den Zielsystemen. Jetzt wird ermittelt, welche Rechner erreichbar sind, welche Dienste sie anbieten und in welcher Version. Diese Lektion erklärt, was dabei technisch passiert. Du brauchst dafür das Wissen aus dem Modul Netzwerk-Grundlagen.

## Vom Netz zum einzelnen Dienst

Die Analyse geht vom Groben ins Feine:

1. Rechner finden: Welche Adressen im freigegebenen Bereich antworten überhaupt?
2. Ports prüfen: Auf welchen Ports nimmt ein Rechner Verbindungen an?
3. Dienste erkennen: Welches Programm in welcher Version steckt hinter einem offenen Port?
4. Schwachstellen zuordnen: Sind für diese Version Sicherheitslücken bekannt?

Ein Portscanner automatisiert die ersten Schritte. Er schickt Verbindungsanfragen an viele Ports und wertet die Antworten aus, so wie du es in der Lektion über TCP gelernt hast: Antwortet ein Port mit SYN-ACK, ist er offen. Kommt RST zurück, ist er geschlossen. Bleibt die Antwort aus, filtert eine Firewall. Das bekannteste Werkzeug dieser Art heißt Nmap.

Schwachstellenscanner wie OpenVAS oder Nessus gehen einen Schritt weiter. Sie vergleichen die erkannten Versionen mit Datenbanken bekannter Lücken und erstellen daraus eine Liste.

## Enumerieren heißt nachfragen

Enumeration bedeutet Aufzählung. Gemeint ist, einen gefundenen Dienst gezielt nach Einzelheiten zu fragen: Welche Verzeichnisse bietet der Webserver an? Welche Freigaben zeigt der Dateiserver? Welche Version meldet der Dienst von sich aus? Viele Dienste sind dabei erstaunlich auskunftsfreudig.

## Ein Ergebnis lesen

Das Ergebnis eines Scans ist eine Tabelle. Ein vereinfachtes Beispiel aus einem Übungslabor:

| Port | Zustand | Dienst | Erkannte Version |
|---|---|---|---|
| 22/tcp | offen | SSH | aktuelle Version |
| 80/tcp | offen | HTTP | Webserver, seit vier Jahren nicht aktualisiert |
| 443/tcp | gefiltert | HTTPS | unbekannt |
| 3306/tcp | offen | MySQL | Datenbank, aus dem ganzen Netz erreichbar |

Ein erfahrener Prüfer liest daraus drei Fragen ab. Warum ist der Webserver so alt, und welche Lücken sind für diese Version bekannt? Warum ist die Datenbank aus dem ganzen Netz erreichbar, obwohl vermutlich nur der Webserver sie braucht? Und was verbirgt sich hinter dem gefilterten Port? Jede dieser Fragen ist ein Ansatzpunkt für die weitere Prüfung und zugleich schon ein möglicher Befund.

## Risiken und Rücksicht

Scans sind nicht harmlos. Sie erzeugen viel Datenverkehr und fallen jeder aufmerksamen Überwachung auf. Empfindliche Geräte wie alte Drucker, Medizintechnik oder Industriesteuerungen können unter einem Scan sogar abstürzen. Deshalb werden Zeitpunkt und Intensität vorher mit dem Auftraggeber abgestimmt.

Dazu kommt: Automatische Scanner irren sich. Sie melden Lücken, die es nicht gibt (falsch positive Ergebnisse), und übersehen andere. Jedes Ergebnis muss von Hand geprüft werden, bevor es in einen Bericht gelangt.

> [!RECHT] Schon ein Portscan gegen fremde Systeme ohne Erlaubnis kann Ärger bedeuten, vom gesperrten Internetanschluss bis zur Anzeige. Gescannt wird nur, was im Scope steht oder dir gehört.

## Die Sicht der Verteidigung

- Eine Firewall lässt nur Verbindungen zu Diensten durch, die erreichbar sein sollen.
- Systeme zur Angriffserkennung bemerken Scans an der Menge der Verbindungsversuche.
- Dienste verraten in ihrer Begrüßung keine Versionsnummer, wenn man sie entsprechend einstellt.
- Wer seine Systeme selbst regelmäßig scannt, kennt die eigene Angriffsfläche, bevor es ein Fremder tut.

?? Was ermittelt ein Portscanner?
( ) Die Passwörter der Benutzer
(x) Auf welchen Ports ein Rechner Verbindungen annimmt
( ) Den Inhalt der Datenbank
!! Ein Portscanner schickt Verbindungsanfragen und wertet die Antworten aus. Er zeigt, welche Dienste erreichbar sind.

?? Ein Schwachstellenscanner meldet eine kritische Lücke. Was folgt daraus?
( ) Die Lücke kommt ungeprüft in den Bericht.
( ) Der Test ist beendet.
(x) Das Ergebnis wird von Hand geprüft, weil Scanner auch falsch positive Meldungen liefern.
!! Scanner vergleichen meist nur Versionsnummern. Ob die Lücke wirklich besteht, muss ein Mensch prüfen.

?? Warum werden Zeitpunkt und Intensität eines Scans mit dem Auftraggeber abgestimmt?
(x) Weil Scans viel Datenverkehr erzeugen und empfindliche Systeme stören können
( ) Weil Scans nur nachts funktionieren
( ) Weil der Auftraggeber die Werkzeuge installieren muss
!! Ein Scan kann empfindliche Geräte zum Absturz bringen und löst Alarme aus. Deshalb wird er abgesprochen.

?? Was versteht man unter Enumeration?
( ) Das Verschlüsseln von Scan-Ergebnissen
( ) Das Löschen von Protokolldateien
(x) Das gezielte Abfragen von Einzelheiten zu einem gefundenen Dienst
!! Enumeration heißt Aufzählung: Verzeichnisse, Freigaben, Versionen und andere Details eines Dienstes werden ermittelt.
