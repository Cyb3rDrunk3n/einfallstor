---
titel: Schwachstellen und Härtung
kurz: Wie Lücken benannt und bewertet werden und mit welchen Maßnahmen Systeme widerstandsfähig werden.
icon: shield
---

# CVE, CVSS und Patches
minuten: 9
xp: 45

Jeden Tag werden neue Sicherheitslücken in Software bekannt. Damit alle Beteiligten über dieselbe Lücke sprechen und ihre Dringlichkeit einschätzen können, gibt es zwei Standards: CVE für die Benennung und CVSS für die Bewertung.

## Was eine Schwachstelle ist

Eine Schwachstelle ist ein Fehler in Software, Konfiguration oder Ablauf, der eines der drei Schutzziele verletzen kann:

| Schutzziel | Bedeutung |
|---|---|
| Vertraulichkeit | Nur Berechtigte können Daten lesen. |
| Integrität | Daten werden nicht unbemerkt verändert. |
| Verfügbarkeit | Systeme und Daten sind nutzbar, wenn sie gebraucht werden. |

Nach den englischen Anfangsbuchstaben (Confidentiality, Integrity, Availability) heißen die drei Ziele oft CIA-Triade.

## CVE: ein Name für jede Lücke

CVE steht für Common Vulnerabilities and Exposures. Jede öffentlich bekannte Schwachstelle erhält eine eindeutige Kennung nach dem Muster `CVE-Jahr-Nummer`, zum Beispiel `CVE-2021-44228` für die Lücke in der Java-Bibliothek Log4j, die Ende 2021 weltweit für Aufregung sorgte. Herstellerhinweise, Scanner und Berichte verwenden diese Kennung, sodass alle dasselbe meinen.

Details zu einer CVE stehen in öffentlichen Datenbanken, etwa der National Vulnerability Database (NVD) der US-Behörde NIST.

## CVSS: wie schwer ist es?

Das Common Vulnerability Scoring System, kurz CVSS, drückt den Schweregrad als Zahl von 0 bis 10 aus:

| Wert | Einstufung |
|---|---|
| 0,1 bis 3,9 | niedrig |
| 4,0 bis 6,9 | mittel |
| 7,0 bis 8,9 | hoch |
| 9,0 bis 10,0 | kritisch |

In den Wert fließen unter anderem ein: Ist die Lücke über das Netz erreichbar oder nur lokal? Wie aufwendig wäre ein Angriff? Braucht es dafür ein Konto? Muss ein Benutzer mitwirken? Und wie stark sind Vertraulichkeit, Integrität und Verfügbarkeit betroffen?

## Der Wert ist nicht das Risiko

Der CVSS-Wert beschreibt die Lücke, nicht deine Lage. Eine kritische Lücke in einem Testsystem ohne Netzanschluss ist weniger dringend als eine mittlere Lücke im Webshop, über den die Firma ihr Geld verdient. Für die Einschätzung des Risikos zählt zusätzlich:

- Ist das System aus dem Internet erreichbar?
- Welche Daten und Abläufe hängen daran?
- Wird die Lücke bereits aktiv ausgenutzt?

## Vom Fund zum Patch

Der Lebenslauf einer Lücke hat meistens diese Stationen: Jemand entdeckt sie und meldet sie dem Hersteller. Der Hersteller entwickelt eine Korrektur, den Patch. Mit dessen Veröffentlichung wird die Lücke öffentlich bekannt. Ab diesem Moment läuft die Uhr, denn jetzt ist allgemein bekannt, wonach man suchen muss.

Eine Lücke, für die es noch keinen Patch gibt, heißt Zero-Day. Solche Lücken machen Schlagzeilen. Viele erfolgreiche Angriffe nutzen aber Schwachstellen, für die es längst einen Patch gibt, der nur nie eingespielt wurde.

Geordnetes Patch-Management besteht aus vier Schritten: wissen, welche Systeme und Software man betreibt, neue Hinweise bewerten, Patches testen und sie zügig ausrollen.

## Im Pentest

Tester gleichen die erkannten Softwareversionen mit bekannten CVEs ab. Jeder Treffer wird geprüft, bevor er als Befund in den Bericht kommt. Eine Versionsnummer allein beweist noch keine Lücke, denn manche Hersteller korrigieren Fehler, ohne die Versionsnummer zu ändern.

?? Was ist eine CVE?
( ) Ein Werkzeug zum Schließen von Sicherheitslücken
(x) Eine eindeutige Kennung für eine öffentlich bekannte Schwachstelle
( ) Eine Verschlüsselungsmethode
!! CVE-Kennungen sorgen dafür, dass Hersteller, Scanner und Berichte dieselbe Lücke meinen.

?? Wie wird ein CVSS-Wert von 9,8 eingestuft?
( ) mittel
( ) hoch
(x) kritisch
!! Ab 9,0 gilt eine Schwachstelle als kritisch. Hoch reicht von 7,0 bis 8,9.

?? Was ist eine Zero-Day-Lücke?
(x) Eine Schwachstelle, für die es noch keinen Patch gibt
( ) Eine Schwachstelle, die am Tag ihrer Entdeckung behoben wurde
( ) Eine Schwachstelle mit dem CVSS-Wert 0
!! Bei einem Zero-Day hatten die Verteidiger null Tage Zeit, einen Patch einzuspielen, weil es noch keinen gibt.

?? Warum reicht der CVSS-Wert allein nicht, um die Dringlichkeit zu bestimmen?
( ) Weil der Wert geheim ist
( ) Weil er sich täglich ändert
(x) Weil er die Lücke beschreibt, aber nicht, wie wichtig und wie erreichbar das betroffene System ist
!! Für das Risiko zählt der Zusammenhang: Erreichbarkeit, Bedeutung des Systems und ob die Lücke bereits ausgenutzt wird.

# Rechteausweitung und Härtung
minuten: 10
xp: 50

Wer in ein System eindringt, landet selten sofort als Administrator. Meist stehen zunächst nur die Rechte eines einfachen Benutzers oder eines Dienstes zur Verfügung. Der Schritt von dort zu höheren Rechten heißt Rechteausweitung, englisch Privilege Escalation.

## Zwei Richtungen

- **Vertikal:** vom normalen Benutzer zum Administrator. Auf Linux wäre das der Weg zu root.
- **Horizontal:** von einem Benutzer zu einem anderen mit gleichen Rechten, zum Beispiel zu den Daten eines Kollegen.

## Woran es liegt

Rechteausweitung geht fast immer auf eine der folgenden Ursachen zurück. Die meisten kennst du aus früheren Lektionen:

| Ursache | Beispiel |
|---|---|
| Zu weit gefasste Rechte | Ein Konto darf mit sudo mehr ausführen, als es für seine Aufgabe braucht. |
| Falsche Dateirechte | Ein Skript, das regelmäßig mit Administratorrechten läuft, ist für alle schreibbar. |
| Herumliegende Zugangsdaten | Passwörter stehen in Skripten, Konfigurationsdateien oder im Befehlsverlauf. |
| Fehlende Patches | Das Betriebssystem enthält eine bekannte Lücke, für die es längst eine Korrektur gibt. |
| Wiederverwendete Passwörter | Das Passwort eines Benutzers passt auch für das Administratorkonto. |

Ein Prüfer geht diese Liste in einem beauftragten Test systematisch durch. Er stellt fest, wer er ist, was er darf, was auf dem System läuft und wo Rechte lockerer gesetzt sind, als sie sein müssten. Das Handwerk ist dasselbe wie in den Linux-Lektionen: lesen, suchen, filtern.

## Härtung: die Antwort der Verteidigung

Härtung bedeutet, ein System so einzustellen, dass es möglichst wenig Angriffsfläche bietet. Die Maßnahmen sind unspektakulär und wirksam:

- **Aufräumen:** Dienste und Programme entfernen, die niemand braucht.
- **Aktuell halten:** Patches für Betriebssystem und Anwendungen zeitnah einspielen.
- **Rechte knapp halten:** Jedes Konto und jeder Dienst bekommt nur, was er braucht. Administratoren arbeiten im Alltag mit einem normalen Konto.
- **Zugangsdaten schützen:** keine Passwörter in Skripten, eigene Passwörter für jedes Konto, Zwei-Faktor-Anmeldung für Administratoren.
- **Netz aufteilen:** Systeme mit unterschiedlichem Schutzbedarf stehen in getrennten Netzsegmenten.
- **Protokollieren und hinsehen:** Ereignisse aufzeichnen und auswerten, damit ein Angriff auffällt.
- **Sichern:** Datensicherungen anlegen, getrennt aufbewahren und die Wiederherstellung üben.

Für die Einzelheiten gibt es anerkannte Vorlagen. Das IT-Grundschutz-Kompendium des BSI beschreibt Anforderungen für viele Arten von Systemen. Die CIS Benchmarks des Center for Internet Security liefern detaillierte Einstellungsempfehlungen für verbreitete Betriebssysteme und Anwendungen.

## Verteidigung in der Tiefe

Keine einzelne Maßnahme hält jeden Angriff auf. Deshalb werden mehrere Schichten kombiniert, sodass nach dem ersten Hindernis das nächste wartet. Der Fachbegriff dafür ist Defense in Depth. Ein Pentest zeigt, wie viele dieser Schichten tatsächlich halten.

> [!MERKE] Für Tester belegt die Rechteausweitung, wie weit jemand nach einem ersten Erfolg käme. Im Bericht steht deshalb die Ursache im Mittelpunkt, denn die kann der Kunde beheben.

?? Was bedeutet vertikale Rechteausweitung?
( ) Der Wechsel in ein anderes Netzsegment
(x) Der Aufstieg von einem normalen Benutzerkonto zu Administratorrechten
( ) Der Zugriff auf die Daten eines gleichgestellten Benutzers
!! Vertikal heißt nach oben, zu höheren Rechten. Der Zugriff auf Daten eines gleichgestellten Benutzers wäre horizontal.

?? Welche Konfiguration begünstigt eine Rechteausweitung?
(x) Ein Skript, das mit Administratorrechten läuft und von jedem Benutzer verändert werden darf
( ) Ein Administratorkonto mit Zwei-Faktor-Anmeldung
( ) Ein Dienst, der abgeschaltet wurde
!! Wer das Skript verändern darf, bestimmt, was mit Administratorrechten ausgeführt wird.

?? Was versteht man unter Härtung?
( ) Das Verschlüsseln aller E-Mails
( ) Den Austausch alter Hardware
(x) Ein System so einzustellen, dass es möglichst wenig Angriffsfläche bietet
!! Härtung umfasst unter anderem das Entfernen unnötiger Dienste, knappe Rechte und zeitnahe Patches.

?? Was beschreibt der Begriff Defense in Depth?
( ) Eine besonders starke Firewall
(x) Mehrere Schutzschichten hintereinander, sodass das Versagen einer Schicht nicht zum Gesamtausfall führt
( ) Die Verteidigung nur der wichtigsten Server
!! Verteidigung in der Tiefe kombiniert mehrere Maßnahmen, weil keine einzelne jeden Angriff aufhält.
